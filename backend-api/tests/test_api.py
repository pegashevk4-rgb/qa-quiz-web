import pytest

from app.models import Company, User, Result, DetailedResult, CompanyHRUser
from tests.conftest import TEST_COMPANY_TOKEN


class TestHealth:
    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestAuth:
    def test_register_hr_user(self, client, sample_company):
        response = client.post(
            "/auth/register",
            json={
                "email": "hr@testcorp.com",
                "password": "secret123",
                "name": "HR Manager",
                "company_id": sample_company.id,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "hr@testcorp.com"
        assert data["name"] == "HR Manager"
        assert data["company_id"] == sample_company.id
        assert data["company_token"] == sample_company.public_token
        assert "id" in data

    def test_register_duplicate_email(self, client, sample_company):
        payload = {
            "email": "hr@testcorp.com",
            "password": "secret123",
            "name": "HR Manager",
            "company_id": sample_company.id,
        }
        client.post("/auth/register", json=payload)
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 400

    def test_login_success(self, client, sample_company):
        client.post(
            "/auth/register",
            json={
                "email": "hr@testcorp.com",
                "password": "secret123",
                "name": "HR Manager",
                "company_id": sample_company.id,
            },
        )
        response = client.post(
            "/auth/login",
            json={"email": "hr@testcorp.com", "password": "secret123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["company_id"] == sample_company.id
        assert data["company_token"] == sample_company.public_token
        assert "access_token" in data

    @pytest.mark.parametrize(
        "email,password,expected_status",
        [
            ("hr@testcorp.com", "wrongpassword", 401),
            ("nobody@testcorp.com", "secret123", 401),
        ],
        ids=["wrong_password", "nonexistent_user"],
    )
    def test_login_invalid_credentials(
        self, client, sample_company, email, password, expected_status
    ):
        client.post(
            "/auth/register",
            json={
                "email": "hr@testcorp.com",
                "password": "secret123",
                "name": "HR Manager",
                "company_id": sample_company.id,
            },
        )
        response = client.post(
            "/auth/login",
            json={"email": email, "password": password},
        )
        assert response.status_code == expected_status


class TestCandidates:
    def test_create_candidate(self, client, sample_company):
        response = client.post(
            "/candidates",
            json={
                "first_name": "Иван",
                "last_name": "Петров",
                "email": "ivan@example.com",
                "company_id": sample_company.id,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == "Иван"
        assert data["last_name"] == "Петров"
        assert data["email"] == "ivan@example.com"
        assert data["company_id"] == sample_company.id

    def test_get_candidate(self, client, sample_company):
        create_resp = client.post(
            "/candidates",
            json={
                "first_name": "Иван",
                "last_name": "Петров",
                "email": "ivan@example.com",
                "company_id": sample_company.id,
            },
        )
        candidate_id = create_resp.json()["id"]

        response = client.get(f"/candidates/{candidate_id}")
        assert response.status_code == 200
        assert response.json()["first_name"] == "Иван"

    def test_get_nonexistent_candidate(self, client, sample_company, db):
        create_resp = client.post(
            "/candidates",
            json={
                "first_name": "Temp",
                "last_name": "User",
                "email": "temp@example.com",
                "company_id": sample_company.id,
            },
        )
        candidate_id = create_resp.json()["id"]

        db.query(User).filter(User.id == candidate_id).delete()
        db.commit()

        response = client.get(f"/candidates/{candidate_id}")
        assert response.status_code == 404

    def test_list_candidates(self, client, sample_company):
        for name, email in [("Иван", "ivan@example.com"), ("Мария", "maria@example.com")]:
            client.post(
                "/candidates",
                json={
                    "first_name": name,
                    "last_name": "Тест",
                    "email": email,
                    "company_id": sample_company.id,
                },
            )

        response = client.get("/candidates")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert {c["email"] for c in data} == {"ivan@example.com", "maria@example.com"}

    def test_list_candidates_empty(self, client, sample_company):
        response = client.get("/candidates")
        assert response.status_code == 200
        assert response.json() == []


class TestPublicQuiz:
    def test_get_public_test_returns_limited_questions(self, client, db):
        from app.models import QuizQuestion

        categories = [f"Category-{i}" for i in range(20)]
        questions = []
        for i in range(50):
            questions.append(
                QuizQuestion(
                    test_id="qa_junior_web",
                    text=f"Question {i}",
                    options=["A", "B", "C", "D"],
                    correct_index=0,
                    order=i + 1,
                    category=categories[i % len(categories)],
                )
            )
        db.add_all(questions)
        db.commit()

        response = client.get("/public/tests/qa_junior_web")
        assert response.status_code == 200
        data = response.json()
        assert data["test_id"] == "qa_junior_web"
        assert len(data["questions"]) <= 35

    def test_get_public_test_returns_404_for_unknown(self, client):
        response = client.get("/public/tests/qa_nonexistent_test")
        assert response.status_code == 404

    def test_get_public_test_correct_structure(self, client, sample_questions):
        response = client.get("/public/tests/qa_junior_web")
        assert response.status_code == 200
        data = response.json()
        assert "test_id" in data
        assert "title" in data
        assert "questions" in data
        assert len(data["questions"]) > 0
        q = data["questions"][0]
        assert "id" in q
        assert "text" in q
        assert "options" in q


class TestPublicSubmit:
    @pytest.mark.parametrize(
        "answers,expected_percent,expected_verdict",
        [
            (
                [
                    {"question_index": 0, "selected_index": 0},
                    {"question_index": 1, "selected_index": 0},
                    {"question_index": 2, "selected_index": 0},
                ],
                100,
                "Passed",
            ),
            (
                [
                    {"question_index": 0, "selected_index": 0},
                    {"question_index": 1, "selected_index": 1},
                    {"question_index": 2, "selected_index": 1},
                ],
                33,
                "Failed",
            ),
        ],
        ids=["all_correct", "partial_correct"],
    )
    def test_submit_scoring(
        self,
        client,
        sample_company,
        sample_questions,
        answers,
        expected_percent,
        expected_verdict,
    ):
        real_answers = [
            {
                "question_id": sample_questions[a["question_index"]].id,
                "selected_index": a["selected_index"],
            }
            for a in answers
        ]
        response = client.post(
            f"/public/tests/qa_junior_web/submit?company_token={sample_company.public_token}",
            json={
                "test_id": "qa_junior_web",
                "answers": real_answers,
                "candidate": {"first_name": "Test", "last_name": "User"},
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["percent"] == expected_percent
        assert data["verdict"] == expected_verdict

    def test_submit_test_all_correct_categories(self, client, sample_company, sample_questions):
        response = client.post(
            f"/public/tests/qa_junior_web/submit?company_token={sample_company.public_token}",
            json={
                "test_id": "qa_junior_web",
                "answers": [
                    {"question_id": sample_questions[0].id, "selected_index": 0},
                    {"question_id": sample_questions[1].id, "selected_index": 0},
                    {"question_id": sample_questions[2].id, "selected_index": 0},
                ],
                "candidate": {
                    "first_name": "Иван",
                    "last_name": "Петров",
                    "email": "ivan@example.com",
                },
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["categories"]) == 2
        assert len(data["strong_areas"]) >= 1

    def test_submit_test_bad_token(self, client, sample_questions):
        response = client.post(
            "/public/tests/qa_junior_web/submit?company_token=bad_token",
            json={
                "test_id": "qa_junior_web",
                "answers": [],
                "candidate": {"first_name": "X", "last_name": "Y"},
            },
        )
        assert response.status_code == 400

    def test_submit_test_nonexistent_test(self, client, sample_company):
        response = client.post(
            f"/public/tests/qa_nonexistent/submit?company_token={sample_company.public_token}",
            json={
                "test_id": "qa_nonexistent",
                "answers": [],
                "candidate": {"first_name": "X", "last_name": "Y"},
            },
        )
        assert response.status_code == 404


class TestCompanyResults:
    def test_get_company_results(self, client, sample_company, db):
        user = User(
            first_name="Иван",
            last_name="Петров",
            email="ivan@example.com",
            company_id=sample_company.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        result = Result(
            user_id=user.id,
            test_id="qa_junior_web",
            total_score=8.0,
            max_score=10.0,
            percent=80,
            verdict="Passed",
            company_id=sample_company.id,
        )
        db.add(result)
        db.commit()
        db.refresh(result)

        detail = DetailedResult(
            result_id=result.id,
            category="Основы тестирования",
            percent=80,
            is_strong=True,
            is_weak=False,
        )
        db.add(detail)
        db.commit()

        response = client.get(f"/api/company/{sample_company.id}/results")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["first_name"] == "Иван"
        assert data[0]["percent"] == 80
        assert data[0]["verdict"] == "Passed"

    def test_get_company_results_empty(self, client, sample_company):
        response = client.get(f"/api/company/{sample_company.id}/results")
        assert response.status_code == 200
        assert response.json() == []

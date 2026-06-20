from app.models import Company, User, Result, DetailedResult, CompanyHRUser


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
        assert data["company_token"] == "test_token_abc123"
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
        assert data["company_token"] == "test_token_abc123"
        assert "access_token" in data

    def test_login_wrong_password(self, client, sample_company):
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
            json={"email": "hr@testcorp.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post(
            "/auth/login",
            json={"email": "nobody@testcorp.com", "password": "secret123"},
        )
        assert response.status_code == 401


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

    def test_get_nonexistent_candidate(self, client, sample_company):
        response = client.get("/candidates/99999")
        assert response.status_code == 404


class TestPublicSubmit:
    def test_submit_test(self, client, sample_company, sample_questions):
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
        assert data["percent"] == 100
        assert data["verdict"] == "Passed"
        assert len(data["categories"]) == 2
        assert len(data["strong_areas"]) >= 1

    def test_submit_test_partial_correct(self, client, sample_company, sample_questions):
        response = client.post(
            f"/public/tests/qa_junior_web/submit?company_token={sample_company.public_token}",
            json={
                "test_id": "qa_junior_web",
                "answers": [
                    {"question_id": sample_questions[0].id, "selected_index": 0},
                    {"question_id": sample_questions[1].id, "selected_index": 1},
                    {"question_id": sample_questions[2].id, "selected_index": 1},
                ],
                "candidate": {
                    "first_name": "Мария",
                    "last_name": "Сидорова",
                },
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["percent"] == 33
        assert data["verdict"] == "Failed"

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

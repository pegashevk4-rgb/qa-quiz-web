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
        assert data["email"] == "hr@testcorp.com"
        assert data["company_token"] == "test_token_abc123"

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

    def test_get_nonexistent_candidate(self, client):
        response = client.get("/candidates/99999")
        assert response.status_code == 404


class TestResults:
    def test_create_result(self, client, sample_company, db):
        user = User(
            first_name="Иван",
            last_name="Петров",
            email="ivan@example.com",
            company_id=sample_company.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        response = client.post(
            "/results",
            json={
                "user_id": user.id,
                "test_id": "qa_junior_web",
                "total_score": 8.0,
                "max_score": 10.0,
                "percent": 80,
                "verdict": "Passed",
                "company_id": sample_company.id,
                "details": [
                    {"category": "Основы тестирования", "percent": 100, "is_strong": True, "is_weak": False},
                    {"category": "Инструменты", "percent": 60, "is_strong": False, "is_weak": False},
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["percent"] == 80
        assert data["verdict"] == "Passed"
        assert data["test_id"] == "qa_junior_web"
        assert len(data["details"]) == 2

    def test_create_result_nonexistent_user(self, client, sample_company):
        response = client.post(
            "/results",
            json={
                "user_id": 99999,
                "test_id": "qa_junior_web",
                "total_score": 5.0,
                "max_score": 10.0,
                "percent": 50,
                "verdict": "On the edge",
                "company_id": sample_company.id,
            },
        )
        assert response.status_code == 400


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

    def test_get_results_isolated_by_company(self, client, db):
        from app.models import Company
        company1 = Company(name="Corp1", public_token="token1", is_paid=True)
        company2 = Company(name="Corp2", public_token="token2", is_paid=True)
        db.add_all([company1, company2])
        db.commit()
        db.refresh(company1)
        db.refresh(company2)

        user1 = User(first_name="A", last_name="B", company_id=company1.id)
        user2 = User(first_name="C", last_name="D", company_id=company2.id)
        db.add_all([user1, user2])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)

        r1 = Result(user_id=user1.id, test_id="qa_junior_web", total_score=8.0, max_score=10.0, percent=80, verdict="Passed", company_id=company1.id)
        r2 = Result(user_id=user2.id, test_id="qa_junior_web", total_score=5.0, max_score=10.0, percent=50, verdict="On the edge", company_id=company2.id)
        db.add_all([r1, r2])
        db.commit()

        resp1 = client.get(f"/api/company/{company1.id}/results")
        resp2 = client.get(f"/api/company/{company2.id}/results")
        assert len(resp1.json()) == 1
        assert len(resp2.json()) == 1
        assert resp1.json()[0]["first_name"] == "A"
        assert resp2.json()[0]["first_name"] == "C"

def test_research_run_and_evidence_matrix(client):
    research_payload = {
        "query": "State of the Art in Transformer Attention Mechanisms",
        "include_academic": True,
        "depth": "standard"
    }

    run_res = client.post("/api/v1/research/run", json=research_payload)
    assert run_res.status_code == 200
    res_data = run_res.json()
    
    assert res_data["status"] == "completed"
    assert "task_id" in res_data
    task_id = res_data["task_id"]
    assert len(res_data["sub_queries"]) >= 1
    assert len(res_data["sources"]) >= 1
    assert len(res_data["evidence_matrix"]) >= 1
    assert res_data["report_markdown"] is not None
    assert "# Evidence-Grounded Research Report" in res_data["report_markdown"] or "Research Report" in res_data["report_markdown"]

    # Fetch task detail
    task_res = client.get(f"/api/v1/research/tasks/{task_id}")
    assert task_res.status_code == 200
    assert task_res.json()["task_id"] == task_id

    # Fetch evidence matrix
    ev_res = client.get(f"/api/v1/research/tasks/{task_id}/evidence")
    assert ev_res.status_code == 200
    assert len(ev_res.json()["evidence_matrix"]) >= 1

    # Fetch contradictions
    cont_res = client.get(f"/api/v1/research/tasks/{task_id}/contradictions")
    assert cont_res.status_code == 200

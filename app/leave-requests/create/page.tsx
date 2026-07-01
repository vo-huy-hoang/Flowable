"use client";

import Link from "next/link";
import { useState } from "react";

export default function CreateLeaveRequestPage() {
  const [employeeName, setEmployeeName] = useState("");
  const [reason, setReason] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/flowable/start-process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeName,
          reason,
          numberOfDays,
        }),
      });

      if (!res.ok) {
        throw new Error("Gửi đơn thất bại");
      }

      setMessage("Đã gửi đơn nghỉ phép thành công. Task đã được chuyển đến Manager.");
      setEmployeeName("");
      setReason("");
      setNumberOfDays(1);
    } catch (error) {
      setMessage(String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="page">
        <div className="hero">
          <div>
            <span className="eyebrow">Employee Portal</span>
            <h1>Tạo đơn nghỉ phép</h1>
            <p className="subtitle">
              Nhân viên nhập thông tin nghỉ phép. Next.js sẽ gọi API nội bộ,
              sau đó API route start process trong Flowable.
            </p>
          </div>

          <nav className="nav-card">
            <Link className="nav-link" href="/leave-requests/create">
              Tạo đơn
            </Link>
            <Link className="nav-link" href="/manager/tasks">
              Manager
            </Link>
            <Link className="nav-link" href="/hr/tasks">
              HR
            </Link>
            <Link className="nav-link" href="/history">
              Lịch sử
            </Link> 
          </nav>
        </div>

        <div className="grid two-columns">
          <section className="card">
            <h2 className="card-title">Thông tin đơn</h2>
            <p className="card-desc">
              Điền đầy đủ thông tin để bắt đầu quy trình Leave Request Approval.
            </p>

            <form onSubmit={submitForm}>
              <div className="form-group">
                <label>Họ tên nhân viên</label>
                <input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                />
              </div>

              <div className="form-group">
                <label>Lý do nghỉ</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Nghỉ phép năm, việc gia đình..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Số ngày nghỉ</label>
                <input
                  type="number"
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi đơn nghỉ phép"}
              </button>
            </form>

            {message && <div className="alert">{message}</div>}
          </section>

          <aside className="stats">
            <div className="stat">
              <div className="stat-value">01</div>
              <div className="stat-label">Employee gửi đơn</div>
            </div>
            <div className="stat">
              <div className="stat-value">02</div>
              <div className="stat-label">Manager duyệt hoặc từ chối</div>
            </div>
            <div className="stat">
              <div className="stat-value">03</div>
              <div className="stat-label">HR xác nhận nếu được duyệt</div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
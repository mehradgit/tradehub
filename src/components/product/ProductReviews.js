"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-toastify";
import ReviewStars from "@/components/ui/ReviewStars";
import CountryFlag from "@/components/ui/CountryFlag";

export default function ProductReviews({ productId, productOwnerId }) {
  const { data: session, status } = useSession();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // فرم
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);

  const isOwner = session?.user?.id === productOwnerId;
  const myReview = session
    ? reviews.find((r) => r.userId === session.user.id)
    : null;

  // ====== دریافت داده‌ها ======
  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setStats(data.stats || { average: 0, total: 0, distribution: {} });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // ====== اگر لاگین شد، فرم را با نظر خودش پر کن ======
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setTitle(myReview.title || "");
      setComment(myReview.comment || "");
    }
  }, [myReview]);

  // ====== ارسال ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.warning("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      toast.success(myReview ? "Review updated" : "Thanks for your review!");
      setEditing(false);
      await fetchReviews();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ====== حذف ======
  const handleDelete = async () => {
    if (!myReview) return;
    if (!confirm("Delete your review?")) return;

    try {
      const res = await fetch(
        `/api/products/${productId}/reviews/${myReview.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Review deleted");
      setRating(0);
      setTitle("");
      setComment("");
      setEditing(false);
      await fetchReviews();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <p style={{ color: "#71807b", fontSize: 14 }}>Loading reviews…</p>
    );
  }

  // ============================================================
  // بخش بالای صفحه: میانگین + توزیع
  // ============================================================
  const distributionEntries = [5, 4, 3, 2, 1];

  return (
    <div>
      {/* ============ خلاصه امتیازها ============ */}
      <div className="pr-summary">
        <div className="pr-average">
          <div className="pr-average-number">
            {stats.average > 0 ? stats.average.toFixed(1) : "—"}
          </div>
          <ReviewStars value={stats.average} size={16} readOnly />
          <div className="pr-average-count">
            {stats.total} {stats.total === 1 ? "review" : "reviews"}
          </div>
        </div>

        <div className="pr-bars">
          {distributionEntries.map((star) => {
            const count = stats.distribution?.[star] || 0;
            const percent = stats.total
              ? Math.round((count / stats.total) * 100)
              : 0;
            return (
              <div key={star} className="pr-bar-row">
                <span className="pr-bar-label">{star} ★</span>
                <div className="pr-bar-track">
                  <div
                    className="pr-bar-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="pr-bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ فرم ============ */}
      {status === "loading" ? null : !session ? (
        <div className="pr-login-prompt">
          <i className="fas fa-lock" />
          <span>
            <Link href="/login">Sign in</Link> to write a review.
          </span>
        </div>
      ) : isOwner ? (
        <div className="pr-login-prompt">
          <i className="fas fa-info-circle" />
          <span>You can't review your own product.</span>
        </div>
      ) : myReview && !editing ? (
        <div className="pr-my-review-note">
          <i className="fas fa-check-circle" />
          <span>
            You rated this {myReview.rating} star
            {myReview.rating !== 1 ? "s" : ""}.
          </span>
          <button
            type="button"
            className="pr-link-btn"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className="pr-link-btn danger"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      ) : (
        <form className="pr-form" onSubmit={handleSubmit}>
          <div className="pr-form-row">
            <label>Your rating</label>
            <ReviewStars value={rating} size={26} onChange={setRating} />
            {rating > 0 && (
              <span className="pr-form-hint">
                {["Terrible", "Poor", "OK", "Good", "Excellent"][rating - 1]}
              </span>
            )}
          </div>

          <input
            type="text"
            placeholder="Short title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="pr-input"
          />

          <textarea
            placeholder="Share your experience with this product… (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={4}
            className="pr-input"
          />

          <div className="pr-form-actions">
            <button
              type="submit"
              className="pr-submit"
              disabled={submitting || rating < 1}
            >
              {submitting
                ? "Saving…"
                : myReview
                ? "Update review"
                : "Post review"}
            </button>
            {myReview && (
              <button
                type="button"
                className="pr-cancel"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* ============ لیست نظرات ============ */}
      <div className="pr-list">
        {reviews.length === 0 ? (
          <div className="pr-empty">
            <i className="fas fa-comment-slash" />
            <p>No reviews yet. Be the first!</p>
          </div>
        ) : (
          reviews.map((r) => {
            const displayName =
              r.user.companyName || r.user.name || "Anonymous";
            const initials = displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const avatar = r.user.logo || r.user.image;
            const isMine = session?.user?.id === r.userId;

            return (
              <div key={r.id} className="pr-item">
                <div className="pr-item-avatar">
                  {avatar ? (
                    <img src={avatar} alt={displayName} />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="pr-item-body">
                  <div className="pr-item-head">
                    <div>
                      <strong>{displayName}</strong>
                      {r.user.countryCode && (
                        <span className="pr-item-country">
                          {" "}
                          <CountryFlag
                            countryCode={r.user.countryCode}
                            size="12px"
                          />{" "}
                          {r.user.country}
                        </span>
                      )}
                    </div>
                    <span className="pr-item-date">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <ReviewStars value={r.rating} size={13} readOnly />

                  {r.title && <h5 className="pr-item-title">{r.title}</h5>}
                  {r.comment && <p className="pr-item-text">{r.comment}</p>}

                  {isMine && (
                    <span className="pr-item-you">Your review</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============ استایل ============ */}
      <style jsx>{`
        .pr-summary {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 24px;
          align-items: center;
          padding: 18px;
          background: #f8fafc;
          border: 1px solid #f1f5f7;
          border-radius: 14px;
          margin-bottom: 20px;
        }
        .pr-average {
          text-align: center;
        }
        .pr-average-number {
          font-family: "Manrope", sans-serif;
          font-size: 40px;
          font-weight: 800;
          color: #0b1f18;
          line-height: 1;
          margin-bottom: 6px;
        }
        .pr-average-count {
          margin-top: 6px;
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }
        .pr-bars {
          display: grid;
          gap: 6px;
        }
        .pr-bar-row {
          display: grid;
          grid-template-columns: 34px 1fr 40px;
          gap: 10px;
          align-items: center;
          font-size: 12px;
        }
        .pr-bar-label {
          color: #64748b;
          font-weight: 700;
        }
        .pr-bar-track {
          height: 8px;
          border-radius: 4px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .pr-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #f5b544, #e08900);
          transition: width 0.4s ease;
        }
        .pr-bar-count {
          text-align: right;
          color: #94a3b8;
          font-weight: 700;
        }

        .pr-login-prompt,
        .pr-my-review-note {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: #eaf7f1;
          border: 1px solid #a7f3d0;
          border-radius: 12px;
          font-size: 13.5px;
          color: #0b5b43;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .pr-login-prompt a {
          color: #0b5b43;
          font-weight: 800;
          text-decoration: underline;
        }
        .pr-link-btn {
          background: transparent;
          border: 0;
          color: #13795b;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          font-family: inherit;
        }
        .pr-link-btn.danger {
          color: #dc2626;
        }

        .pr-form {
          display: grid;
          gap: 12px;
          padding: 18px;
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 14px;
          margin-bottom: 24px;
        }
        .pr-form-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pr-form-row label {
          font-size: 13px;
          font-weight: 700;
          color: #0b1f18;
        }
        .pr-form-hint {
          font-size: 12.5px;
          color: #13795b;
          font-weight: 700;
        }
        .pr-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e8edf0;
          border-radius: 10px;
          font-size: 13.5px;
          font-family: inherit;
          color: #0b1f18;
          outline: none;
          resize: vertical;
          box-sizing: border-box;
        }
        .pr-input:focus {
          border-color: #13795b;
          box-shadow: 0 0 0 3px rgba(19, 121, 91, 0.1);
        }
        .pr-form-actions {
          display: flex;
          gap: 8px;
        }
        .pr-submit {
          padding: 10px 22px;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border: 0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .pr-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pr-cancel {
          padding: 10px 18px;
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
          font-family: inherit;
        }

        .pr-list {
          display: flex;
          flex-direction: column;
        }
        .pr-item {
          display: flex;
          gap: 14px;
          padding: 18px 0;
          border-bottom: 1px solid #f1f5f7;
        }
        .pr-item:last-child {
          border-bottom: none;
        }
        .pr-item-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          display: grid;
          place-items: center;
          font-size: 15px;
          font-weight: 800;
          overflow: hidden;
          flex-shrink: 0;
          font-family: "Manrope", sans-serif;
        }
        .pr-item-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pr-item-body {
          flex: 1;
          min-width: 0;
        }
        .pr-item-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .pr-item-head strong {
          font-size: 14px;
          color: #0b1f18;
        }
        .pr-item-country {
          font-size: 11.5px;
          color: #64748b;
          margin-left: 4px;
        }
        .pr-item-date {
          font-size: 11.5px;
          color: #94a3b8;
        }
        .pr-item-title {
          margin: 6px 0 4px;
          font-size: 14px;
          font-weight: 800;
          color: #0b1f18;
        }
        .pr-item-text {
          margin: 4px 0 0;
          font-size: 13.5px;
          line-height: 1.7;
          color: #334155;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .pr-item-you {
          display: inline-block;
          margin-top: 8px;
          padding: 2px 9px;
          background: #eaf7f1;
          color: #0b5b43;
          border-radius: 50px;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .pr-empty {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
        }
        .pr-empty i {
          font-size: 34px;
          opacity: 0.3;
          display: block;
          margin-bottom: 10px;
        }
        .pr-empty p {
          margin: 0;
          font-size: 13.5px;
        }

        @media (max-width: 640px) {
          .pr-summary {
            grid-template-columns: 1fr;
            gap: 14px;
            padding: 14px;
          }
          .pr-average-number {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}
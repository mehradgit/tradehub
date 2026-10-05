// src/components/ui/Captcha.js
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";

const Captcha = forwardRef(function Captcha({ disabled = false }, ref) {
  const [question, setQuestion] = useState("");
  const [token, setToken] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCaptcha = useCallback(async () => {
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/captcha", { cache: "no-store" });
      const data = await res.json();
      setQuestion(data.question);
      setToken(data.token);
    } catch (err) {
      console.error("Captcha fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  // Expose the methods to the parent
  useImperativeHandle(
    ref,
    () => ({
      getPayload: () => ({ answer, token }),
      refresh: fetchCaptcha,
      isReady: () => !!token && !!answer,
    }),
    [answer, token, fetchCaptcha]
  );

  return (
    <div className="captcha-wrapper">
      <label className="form-label fw-semibold">
        Security Check <span className="text-danger">*</span>
      </label>
      <div className="captcha-row">
        <div className="captcha-question">
          {loading ? (
            <span className="spinner-border spinner-border-sm" />
          ) : (
            <span>{question}</span>
          )}
          <button
            type="button"
            className="captcha-refresh"
            onClick={fetchCaptcha}
            disabled={loading || disabled}
            title="New challenge"
          >
            <i className="fas fa-rotate-right"></i>
          </button>
        </div>
        <input
          type="number"
          inputMode="numeric"
          className="form-control captcha-input"
          placeholder="Your answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled || loading}
          required
        />
      </div>

      <style jsx>{`
        .captcha-wrapper {
          margin-bottom: 16px;
        }
        .captcha-row {
          display: flex;
          gap: 10px;
          align-items: stretch;
        }
        .captcha-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 14px;
          background: #f6f8f9;
          border: 1.5px solid #e8edf0;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          color: #13251f;
          min-width: 160px;
          user-select: none;
        }
        .captcha-refresh {
          background: transparent;
          border: none;
          color: #13795b;
          cursor: pointer;
          font-size: 13px;
          padding: 2px 6px;
          border-radius: 6px;
          transition: 0.2s;
        }
        .captcha-refresh:hover:not(:disabled) {
          background: #eaf7f1;
        }
        .captcha-refresh:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .captcha-input {
          flex: 1;
          min-width: 0;
          padding: 10px 14px;
          border: 1.5px solid #e8edf0;
          border-radius: 12px;
          font-size: 14px;
          background: white;
        }
        .captcha-input:focus {
          border-color: #13795b;
          box-shadow: 0 0 0 3px rgba(19, 121, 91, 0.1);
          outline: none;
        }
      `}</style>
    </div>
  );
});

export default Captcha;
import React, { useState, useEffect } from "react";

const AddAttemptModal = ({
  open,
  onClose,
  onSubmit,
  route,
  defaultAttemptNo,
}) => {
  const [result, setResult] = useState("");
  const [resultOptions, setResultOptions] = useState([]);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [attemptNo, setAttemptNo] = useState(defaultAttemptNo || 1);
  const [video, setVideo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState("");
  const [modeOptions, setModeOptions] = useState([]);

  useEffect(() => {
    if (open) {
      fetch("/api/misc_additions?entity=result") // changed from http://localhost:7071/api/misc_additions?entity=result for deployment
        .then((res) => res.json())
        .then((data) => {
          setResultOptions(data.results.map((r) => r.Result));
        })
        .catch(() => setResultOptions([]));
      fetch("/api/misc_additions?entity=mode") // changed from http://localhost:7071/api/misc_additions?entity=mode for deployment
        .then((res) => res.json())
        .then((data) => {
          setModeOptions(data.results.map((r) => r.Mode_column));
        })
        .catch(() => setModeOptions([]));
      // Set default date and time to now if not already set
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      if (!date) setDate(`${yyyy}-${mm}-${dd}`);
      if (!time) setTime(`${hh}:${min}`);
    }
  }, [open, date, time]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      rid: route.RID,
      mode,
      result,
      rating,
      notes,
      attemptNo,
      video,
      date,
      time,
    });
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          minWidth: 320,
        }}
      >
        <h3>Add Attempt for Route {route.RID}</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Attempt No:</label>
            <input
              type="number"
              min="1"
              value={attemptNo}
              onChange={(e) => setAttemptNo(Number(e.target.value))}
              required
              style={{ width: 60 }}
            />
          </div>
          <div>
            <label>Result:</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              required
            >
              <option value="">Select</option>
              {resultOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Rating (0-5):</label>
            <input
              type="number"
              min="0"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
          <div>
            <label>Notes:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <label>Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label>Time:</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <label>Video URL:</label>
            <input
              type="text"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
            />
          </div>
          <div>
            <label>Mode:</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              required
            >
              <option value="">Select</option>
              {modeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit">Add Attempt</button>
            <button type="button" onClick={onClose} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAttemptModal;

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import AddAttemptModal from "./AddAttemptModal";
import styles from '../RoutesByLocation.module.css';

// Format date as D-MMM (e.g. 6-Jun, 15-Dec)
function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${d.getDate()}-${d.toLocaleString('en-US', { month: 'short' })}`;
}
// Format time as HH:MM (e.g. 21:46, 9:45)
function formatTimeShort(timeStr) {
  if (!timeStr) return '';
  // Handles both 'HH:MM:SS' and 'HH:MM' and possibly with date prefix
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : timeStr;
}

// Combine date and time into 'D-MMM HH:MM' format
function formatDatetime(dateStr, timeStr) {
  if (!dateStr && !timeStr) return '';
  const datePart = formatDateShort(dateStr);
  const timePart = formatTimeShort(timeStr);
  return `${datePart} ${timePart}`.trim();
}


const ProjectsDashboard = ({ username, company, suburb, climbType }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (username && company && suburb && climbType) {
      setLoading(true);
      fetch(
        `https://climbing-backend-functions.azurewebsites.net/api/attempts?dashboard=projects&username=${encodeURIComponent(
          username
        )}&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(
          suburb
        )}&type_column=${encodeURIComponent(climbType)}`
      )
        .then((res) => res.json())
        .then((data) => {
          setProjects(data.projects || []);
          setLoading(false);
        })
        .catch(() => {
          setProjects([]);
          setLoading(false);
        });
    } else {
      setProjects([]);
    }
  }, [username, company, suburb, climbType]);

  if (!username || !company || !suburb || !climbType) {
    return (
      <div style={{ margin: 24 }}>
        <h3>Projects</h3>
        <div>Select a Company, Gym and Climb Type to see your Projects</div>
      </div>
    );
  }
  return (
    <div className={styles.dashboardContainer}>
      <h3>Projects</h3>
      {loading ? (
        <div>Loading...</div>
      ) : projects.length === 0 ? (
        <div>No projects found.</div>
      ) : (
        <table className={styles.styledTable}>
          <thead>
            <tr>
              <th>Gr</th>
              <th>Colour</th>
              <th>Loc</th>
              <th>Mode</th>
              <th>Att</th>
              <th>Last Attempt</th>
              <th>Best Result</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => (
              <tr key={idx}>
                <td>{p.Grade}</td>
                <td>{p.Colour}</td>
                <td>{p.Location}</td>
                <td>{p.Mode_column}</td>
                <td>{p.Attempts}</td>
                <td>{formatDateShort(p.LastAttempt)}</td>
                <td>{p.BestResult}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

function AddRouteModal({
  open,
  onClose,
  onSubmit,
  grades,
  colors,
  loading,
  error,
}) {
  const [grade, setGrade] = useState("");
  const [color, setColor] = useState("");
  const [numberHolds, setNumberHolds] = useState("");
  const initialFocus = useRef(null);

  useEffect(() => {
    if (open) {
      setGrade("");
      setColor("");
      setNumberHolds("");
      if (initialFocus.current) initialFocus.current.focus();
    }
  }, [open]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          maxWidth: 400,
          margin: "80px auto",
          padding: 24,
          borderRadius: 8,
          boxShadow: "0 2px 12px #0002",
        }}
      >
        <h3>Add New Route</h3>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ grade, color, numberHolds });
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label>
              Grade:
              <br />
              <select
                ref={initialFocus}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
                style={{ width: "100%" }}
              >
                <option value="">Select Grade</option>
                {grades.map((g) => (
                  <option key={g.Grade} value={g.Grade}>
                    {g.Grade}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>
              Colour:
              <br />
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
                style={{ width: "100%" }}
              >
                <option value="">Select Colour</option>
                {colors.map((c) => (
                  <option key={c.Colour} value={c.Colour}>
                    {c.Colour}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {/* Show Number of Holds if Boulder */}
          {grades.length > 0 && colors.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label>
                Number of Holds (Boulder only):
                <br />
                <input
                  type="number"
                  min="0"
                  value={numberHolds}
                  onChange={(e) => setNumberHolds(e.target.value)}
                  style={{ width: "100%" }}
                />
              </label>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoutesByLocation({ username }) {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [suburb, setSuburb] = useState("");
  const [climbType, setClimbType] = useState("");
  const [climbTypes, setClimbTypes] = useState([]);
  const [location, setLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [typeColumn, setTypeColumn] = useState("Sport");
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [attemptModalOpen, setAttemptModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [nextAttemptNo, setNextAttemptNo] = useState(1);
  const [userAttempts, setUserAttempts] = useState([]);
  const [, setAttemptsLoading] = useState(false);
  const [sortedAttempts, setSortedAttempts] = useState([]);
  // Sorting state for All Attempts Sorted by Difficulty
  const [sortBy, setSortBy] = useState('Grade');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  // Helper for sorting
  function handleSort(column) {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  }

  function renderSortIcon(column) {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? '▲' : '▼';
  }

  function getSortedAttempts() {
    const attempts = [...sortedAttempts];
    return attempts.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'Grade':
          valA = a.GradeOrder ?? a.Grade;
          valB = b.GradeOrder ?? b.Grade;
          break;
        case 'Mode_column':
          valA = a.Mode_column || '';
          valB = b.Mode_column || '';
          break;
        case 'Result':
          valA = a.ResultOrder ?? 0;
          valB = b.ResultOrder ?? 0;
          break;
        case 'Datetime': {
          // Combine date and time for sorting
          const dateA = new Date(`${a.Date_column}T${a.Time_column || '00:00'}`);
          const dateB = new Date(`${b.Date_column}T${b.Time_column || '00:00'}`);
          valA = dateA;
          valB = dateB;
          break;
        }
        default:
          valA = a[sortBy] || '';
          valB = b[sortBy] || '';
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  const [addRouteOpen, setAddRouteOpen] = useState(false);
  const [grades, setGrades] = useState([]);
  const [colors, setColors] = useState([]);
  const [addRouteLoading, setAddRouteLoading] = useState(false);
  const [addRouteError, setAddRouteError] = useState("");

  // Fetch companies on mount
  useEffect(() => {
    console.log("Fetching companies with username:", username);
    fetch(
      "https://climbing-backend-functions.azurewebsites.net/api/misc_additions?entity=company",
      // `${process.env.REACT_APP_API_URL}/misc_additions?entity=company`,
      {
        //http://localhost:7071/api/misc_additions?entity=company
        headers: { "X-Username": username },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched companies data:", data);
        setCompanies(data.results.map((r) => r.CompanyName));
      })
      .catch((err) => {
        console.error("Error fetching companies:", err);
        setCompanies([]);
      });
  }, [username]);

  // Fetch gyms when company changes
  useEffect(() => {
    setSuburb("");
    setGyms([]);
    setClimbType("");
    setClimbTypes([]);
    setLocation("");
    setLocations([]);
    if (company) {
      fetch(
        `https://climbing-backend-functions.azurewebsites.net/api/misc_additions?entity=gym&company=${encodeURIComponent(
          company
        )}`
        // `${process.env.REACT_APP_API_URL}/misc_additions?entity=gym&company=${encodeURIComponent(
        //   company
        // )}`
      ) // http://localhost:7071/api/misc_additions?entity=gym&company=${encodeURIComponent(company)}
        .then((res) => res.json())
        .then((data) => setGyms(data.results.map((r) => r.Suburb)))
        .catch(() => setGyms([]));
    }
  }, [company]);

  // Fetch climb types and locations when suburb changes
  useEffect(() => {
    setClimbType("");
    setClimbTypes([]);
    setLocation("");
    setLocations([]);
    if (company && suburb) {
      fetch(
        `https://climbing-backend-functions.azurewebsites.net/api/misc_additions?entity=climbtype_location&company=${encodeURIComponent(
          company
        )}&suburb=${encodeURIComponent(suburb)}`
      )
        .then((res) => res.json())
        .then((data) => {
          const types = data.climbtypes.map((t) => t.ClimbType);
          setClimbTypes(types);
          setLocations(
            data.locations.map((l) => ({
              name: l.Location,
              climbType: l.ClimbType,
            }))
          );
          if (types.length === 1) {
            setClimbType(types[0]);
          }
        })
        .catch(() => {
          setClimbTypes([]);
          setLocations([]);
        });
    }
  }, [company, suburb]);

  // Fetch attempts for all current routes at location for this user
  useEffect(() => {
    if (company && suburb && location && climbType && username) {
      setAttemptsLoading(true);
      fetch(
        `https://climbing-backend-functions.azurewebsites.net/api/attempts?username=${encodeURIComponent(
          username
        )}&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(
          suburb
        )}&location=${encodeURIComponent(
          location
        )}&type_column=${encodeURIComponent(climbType)}`
      )
        .then((res) => res.json())
        .then((data) => {
          setUserAttempts(data.attempts || []);
          setAttemptsLoading(false);
        })
        .catch(() => {
          setUserAttempts([]);
          setAttemptsLoading(false);
        });
    } else {
      setUserAttempts([]);
    }
  }, [company, suburb, location, climbType, username]);

  // Fetch all sorted attempts for dashboard display at the bottom (all locations)
  useEffect(() => {
    if (company && suburb && climbType && username) {
      fetch(
        `https://climbing-backend-functions.azurewebsites.net/api/attempts?dashboard=all_attempts_sorted&username=${encodeURIComponent(
          username
        )}&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(
          suburb
        )}&type_column=${encodeURIComponent(climbType)}`
      )
        .then((res) => res.json())
        .then((data) => {
          setSortedAttempts(data.sorted_attempts || []);
        })
        .catch(() => {
          setSortedAttempts([]);
        });
    } else {
      setSortedAttempts([]);
    }
  }, [company, suburb, climbType, username]);

  // Fetch grades/colors when addRouteOpen is triggered
  useEffect(() => {
    if (addRouteOpen && company && suburb && climbType) {
      setAddRouteError("");
      setGrades([]);
      setColors([]);
      // Fetch grades - URL changed from http://localhost:7071/api/misc_additions?entity=grades
      fetch(
        `https://climbing-backend-functions.azurewebsites.net/api/misc_additions?entity=grades&company=${encodeURIComponent(
          company
        )}&suburb=${encodeURIComponent(suburb)}&climbType=${encodeURIComponent(
          climbType
        )}`,
        {
          headers: { "X-Username": username },
        }
      )
        .then((res) => res.json())
        .then((data) =>
          setGrades(
            (data.results || []).sort((a, b) => a.GradeOrder - b.GradeOrder)
          )
        )
        .catch(() => setGrades([]));
      // Fetch colors - URL changed from http://localhost:7071/api/misc_additions?entity=colours
      fetch(
        `https://climbing-backend-functions.azurewebsites.net/api/misc_additions?entity=colours&company=${encodeURIComponent(
          company
        )}`,
        {
          headers: { "X-Username": username },
        }
      )
        .then((res) => res.json())
        .then((data) => setColors(data.results || []))
        .catch(() => setColors([]));
    }
  }, [addRouteOpen, company, suburb, climbType, username]);

  // Filter locations by selected climb type and sort numerically if possible
  let filteredLocations = climbType
    ? locations.filter((l) => l.climbType === climbType)
    : locations;
  // Try to sort numerically if all names are numbers
  if (
    filteredLocations.length > 0 &&
    filteredLocations.every((l) => /^\d+$/.test(l.name))
  ) {
    filteredLocations = [...filteredLocations].sort((a, b) => Number(a.name) - Number(b.name));
  }

  const fetchRoutes = async () => {
    setLoading(true);
    setError("");
    setRoutes([]);
    try {
      const params = new URLSearchParams({
        company,
        suburb,
        location,
        type_column: climbType,
      });
      const res = await fetch(
        `https://climbing-backend-functions.azurewebsites.net/api/routes?${params.toString()}`,
        {
          headers: { "X-Username": username },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch routes");
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const archiveRoute = async (rid) => {
    setError("");
    try {
      console.log("Archiving route with username:", username);
      const res = await fetch(
        "https://climbing-backend-functions.azurewebsites.net/api/routes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Username": username,
          },
          body: JSON.stringify({ action: "archive", rid }),
        }
      );
      if (!res.ok) throw new Error("Failed to archive route");
      await fetchRoutes();
    } catch (e) {
      console.error("Error archiving route:", e);
      setError(e.message);
    }
  };

  const handleAddAttemptClick = (route) => {
    // Optionally, fetch the current max attempt number for this route from backend if needed
    setSelectedRoute(route);
    setNextAttemptNo(1); // Or logic to determine next attempt number
    setAttemptModalOpen(true);
  };

  const handleAttemptSubmit = async (attemptData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        "https://climbing-backend-functions.azurewebsites.net/api/attempts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Username": username,
          },
          body: JSON.stringify(attemptData),
        }
      );
      if (!res.ok) throw new Error("Failed to add attempt");
      setAttemptModalOpen(false);
      setSelectedRoute(null);
      await fetchRoutes();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async ({ grade, color, numberHolds }) => {
    setAddRouteLoading(true);
    setAddRouteError("");
    try {
      const routeObj = {
        companyName: company,
        suburb,
        location,
        type_column: climbType,
        grade,
        colour: color,
        numberHolds: climbType === "Boulder" ? Number(numberHolds) : undefined,
      };
      const body = {
        action: "add",
        routes: [routeObj],
      };
      const res = await fetch(
        "https://climbing-backend-functions.azurewebsites.net/api/routes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Username": username,
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("Failed to add route");
      setAddRouteOpen(false);
      await fetchRoutes();
    } catch (e) {
      setAddRouteError(e.message);
    } finally {
      setAddRouteLoading(false);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Projects Dashboard at the top */}
      <ProjectsDashboard
        username={username}
        company={company}
        suburb={suburb}
        climbType={climbType}
      />
      <h3>Manage Routes, Add Attempts</h3>
      <div style={{ marginBottom: 16 }}>
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          style={{ marginRight: 8 }}
        >
          <option value="">Select Company</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          style={{ marginRight: 8 }}
          disabled={!company}
        >
          <option value="">Select Gym</option>
          {gyms.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={climbType}
          onChange={(e) => setClimbType(e.target.value)}
          style={{ marginRight: 8 }}
          disabled={!suburb || climbTypes.length === 0}
        >
          <option value="">Select Climb Type</option>
          {climbTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ marginRight: 8 }}
          disabled={!climbType}
        >
          <option value="">Select Location</option>
          {filteredLocations.map((l) => (
            <option key={l.name} value={l.name}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          value={typeColumn}
          onChange={(e) => setTypeColumn(e.target.value)}
          style={{ display: "none" }}
        >
          <option value="Sport">Sport</option>
          <option value="Boulder">Boulder</option>
        </select>
        <button
          onClick={fetchRoutes}
          style={{ marginLeft: 12 }}
          disabled={!(company && suburb && climbType && location)}
        >
          Fetch Routes
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {company && suburb && climbType && location && !loading && (
        <div style={{ margin: "16px 0" }}>
          <button onClick={() => setAddRouteOpen(true)} disabled={loading}>
            Add New Route
          </button>
        </div>
      )}
      <table
        className={styles.styledTable}
        style={{ marginTop: 16 }}
      >
        <thead>
          <tr>
            <th>Grade</th>
            <th>Colour</th>
            {climbType === "Boulder" && <th>Num Holds</th>}
            <th>Archive</th>
            <th>Add Attempt</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route.RID}>
              <td>{route.Grade}</td>
              <td>{route.Colour}</td>
              {climbType === "Boulder" && <td>{route.NumberHolds}</td>}
              <td>
                <button onClick={() => archiveRoute(route.RID)}>Archive</button>
              </td>
              <td>
                <button onClick={() => handleAddAttemptClick(route)}>
                  Add Attempt
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Add new gym details */}
      <div style={{ marginTop: 32 }}>
      <h3>Add New Gym Details</h3>
      <button onClick={() => navigate('/add-gyms')} className="btn btn-info mt-2 ms-2">Add new gym details</button>
      </div>
      {/* Previous Attempts at this Location - div and table styles as per previous table*/}
        <div className={styles.dashboardContainer}>
          <h3>Your Attempts at this Location</h3>
          {loading ? (
            <div>Loading...</div>
          ) : userAttempts.length === 0 ? (
            <div>No attempts found.</div>
          ) : (
            <table className={styles.styledTable}>
              <thead>
                <tr>
                  <th>Gr</th>
                  <th>Colour</th>
                  <th>Mode</th>
                  <th>Result</th>
                  <th>Comments</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {userAttempts.map((a, idx) => (
                  <tr key={idx}>
                    <td>{a.Grade}</td>
                    <td>{a.Colour}</td>
                    <td>{a.Mode_column}</td>
                    <td>{a.Result}</td>
                    <td>{a.Notes}</td>
                    <td>{formatDateShort(a.Date_column)}</td>
                    <td>{formatTimeShort(a.Time_column)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {sortedAttempts.length > 0 && (
          <div className={styles.dashboardContainer}>
            <h3>All Attempts by Difficulty</h3>
            <table className={styles.styledTable}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('Grade')} style={{cursor: 'pointer'}}>Grade {renderSortIcon('Grade')}</th>
                  <th>Colour</th>
                  <th onClick={() => handleSort('Mode_column')} style={{cursor: 'pointer'}}>Mode {renderSortIcon('Mode_column')}</th>
                  <th onClick={() => handleSort('Result')} style={{cursor: 'pointer'}}>Result {renderSortIcon('Result')}</th>
                  <th>Comments</th>
                  <th onClick={() => handleSort('Datetime')} style={{cursor: 'pointer'}}>Datetime {renderSortIcon('Datetime')}</th>
                </tr>
              </thead>
              <tbody>
                {getSortedAttempts().map((a, idx) => (
                  <tr key={idx}>
                    <td>{a.Grade}</td>
                    <td>{a.Colour}</td>
                    <td>{a.Mode_column}</td>
                    <td>{a.Result}</td>
                    <td>{a.Notes}</td>
                    <td>{formatDatetime(a.Date_column, a.Time_column)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
      <AddAttemptModal
        open={attemptModalOpen}
        onClose={() => setAttemptModalOpen(false)}
        onSubmit={handleAttemptSubmit}
        route={selectedRoute || {}}
        defaultAttemptNo={nextAttemptNo}
      />
      <AddRouteModal
        open={addRouteOpen}
        onClose={() => setAddRouteOpen(false)}
        onSubmit={handleAddRoute}
        grades={grades}
        colors={colors}
        loading={addRouteLoading}
        error={addRouteError}
      />
    </div>
  );
}

export default RoutesByLocation;

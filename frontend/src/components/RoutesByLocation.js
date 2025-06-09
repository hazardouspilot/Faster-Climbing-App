import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import AddAttemptModal from "./AddAttemptModal";

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
        // `${process.env.REACT_APP_API_URL}/attempts?dashboard=projects&username=${encodeURIComponent(
        //   username
        // )}&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(
        //   suburb
        // )}&type_column=${encodeURIComponent(climbType)}`
      ) // changed from http://localhost:7071/api/attempts for deployment
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
        <h2>Projects</h2>
        <div>Select a Company, Gym and Climb Type to see your Projects</div>
      </div>
    );
  }
  return (
    <div style={{ margin: 24 }}>
      <h2>Projects</h2>
      {loading ? (
        <div>Loading...</div>
      ) : projects.length === 0 ? (
        <div>No projects found.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Grade</th>
              <th>Colour</th>
              <th>Location</th>
              <th>Mode</th>
              <th>Attempts</th>
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
                <td>{p.LastAttempt}</td>
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
        // `${process.env.REACT_APP_API_URL}/misc_additions?entity=climbtype_location&company=${encodeURIComponent(
        //   company
        // )}&suburb=${encodeURIComponent(suburb)}`
      ) //http://localhost:7071/api/misc_additions?entity=climbtype_location&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(suburb)}
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
          // changed from http://localhost:7071/api/attempts
          username
        )}&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(
          suburb
        )}&location=${encodeURIComponent(
          location
        )}&type_column=${encodeURIComponent(climbType)}`
        // `${process.env.REACT_APP_API_URL}/attempts?username=${encodeURIComponent(
        //   username
        // )}&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(
        //   suburb
        // )}&location=${encodeURIComponent(
        //   location
        // )}&type_column=${encodeURIComponent(climbType)}`
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
          // changed from http://localhost:7071/api/attempts
          username
        )}&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(
          suburb
        )}&type_column=${encodeURIComponent(climbType)}`
        // `${process.env.REACT_APP_API_URL}/attempts?dashboard=all_attempts_sorted&username=${encodeURIComponent(
        //   username
        // )}&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(
        //   suburb
        // )}&type_column=${encodeURIComponent(climbType)}`
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
        // `${process.env.REACT_APP_API_URL}/misc_additions?entity=grades&company=${encodeURIComponent(
        //   company
        // )}&suburb=${encodeURIComponent(suburb)}&climbType=${encodeURIComponent(
        //   climbType
        // )}`,
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
        // `${process.env.REACT_APP_API_URL}/misc_additions?entity=colours&company=${encodeURIComponent(
        //   company
        // )}`,
        {
          headers: { "X-Username": username },
        }
      )
        .then((res) => res.json())
        .then((data) => setColors(data.results || []))
        .catch(() => setColors([]));
    }
  }, [addRouteOpen, company, suburb, climbType, username]);

  // Filter locations by selected climb type
  const filteredLocations = climbType
    ? locations.filter((l) => l.climbType === climbType)
    : locations;

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
        // `${process.env.REACT_APP_API_URL}/routes?${params.toString()}`,
        {
          // changed from http://localhost:7071/api/routes
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
        // `${process.env.REACT_APP_API_URL}/routes`,
        {
          // changed from http://localhost:7071/api/routes
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
        // `${process.env.REACT_APP_API_URL}/attempts`,
        {
          // changed from http://localhost:7071/api/attempts
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
        // `${process.env.REACT_APP_API_URL}/routes`,
        {
          // changed from http://localhost:7071/api/routes
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
    <div>
      {/* Projects Dashboard at the top */}
      <ProjectsDashboard
        username={username}
        company={company}
        suburb={suburb}
        climbType={climbType}
      />
      <h2>View & Manage Routes by Location</h2>
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
        <button onClick={() => navigate('/add-gyms')} className="btn btn-info mt-2 ms-2">Add a new gym</button>
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
        border="1"
        cellPadding="4"
        style={{ width: "100%", marginTop: 16 }}
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
      {/* Previous Attempts at this Location */}
      {userAttempts.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3>Your Previous Attempts at this Location</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Grade</th>
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
                  <td>{a.Date_column}</td>
                  <td>{a.Time_column}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* All attempts sorted by difficulty at the bottom (all locations) */}
      {sortedAttempts.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3>All Attempts Sorted by Difficulty (All Locations)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Colour</th>
                <th>Location</th>
                <th>Mode</th>
                <th>Attempt No</th>
                <th>Result</th>
                <th>Comments</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {sortedAttempts.map((a, idx) => (
                <tr key={idx}>
                  <td>{a.Grade}</td>
                  <td>{a.Colour}</td>
                  <td>{a.Location}</td>
                  <td>{a.Mode_column}</td>
                  <td>{a.AttemptNo}</td>
                  <td>{a.Result}</td>
                  <td>{a.Notes}</td>
                  <td>{a.Date_column}</td>
                  <td>{a.Time_column}</td>
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

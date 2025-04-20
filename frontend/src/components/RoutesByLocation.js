import React, { useState, useEffect } from 'react';
import AddAttemptModal from './AddAttemptModal';

function RoutesByLocation({ username }) {
  const [company, setCompany] = useState('');
  const [suburb, setSuburb] = useState('');
  const [climbType, setClimbType] = useState('');
  const [climbTypes, setClimbTypes] = useState([]);
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [typeColumn, setTypeColumn] = useState('Sport');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [attemptModalOpen, setAttemptModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [nextAttemptNo, setNextAttemptNo] = useState(1);
  const [userAttempts, setUserAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    console.log("Fetching companies with username:", username);
    fetch('http://localhost:7071/api/misc_additions?entity=company', {
      headers: { 'X-Username': username }
    })
      .then(res => res.json())
      .then(data => {
        console.log("Fetched companies data:", data);
        setCompanies(data.results.map(r => r.CompanyName));
      })
      .catch((err) => {
        console.error("Error fetching companies:", err);
        setCompanies([]);
      });
  }, [username]);

  // Fetch gyms when company changes
  useEffect(() => {
    setSuburb('');
    setGyms([]);
    setClimbType('');
    setClimbTypes([]);
    setLocation('');
    setLocations([]);
    if (company) {
      fetch(`http://localhost:7071/api/misc_additions?entity=gym&company=${encodeURIComponent(company)}`)
        .then(res => res.json())
        .then(data => setGyms(data.results.map(r => r.Suburb)))
        .catch(() => setGyms([]));
    }
  }, [company]);

  // Fetch climb types and locations when suburb changes
  useEffect(() => {
    setClimbType('');
    setClimbTypes([]);
    setLocation('');
    setLocations([]);
    if (company && suburb) {
      fetch(`http://localhost:7071/api/misc_additions?entity=climbtype_location&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(suburb)}`)
        .then(res => res.json())
        .then(data => {
          const types = data.climbtypes.map(t => t.ClimbType);
          setClimbTypes(types);
          setLocations(data.locations.map(l => ({ name: l.Location, climbType: l.ClimbType })));
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
    if (
      company &&
      suburb &&
      location &&
      climbType &&
      username
    ) {
      setAttemptsLoading(true);
      fetch(
        `http://localhost:7071/api/attempts?username=${encodeURIComponent(
          username
        )}&company=${encodeURIComponent(company)}&suburb=${encodeURIComponent(
          suburb
        )}&location=${encodeURIComponent(location)}&type_column=${encodeURIComponent(
          climbType
        )}`
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

  // Filter locations by selected climb type
  const filteredLocations = climbType
    ? locations.filter(l => l.climbType === climbType)
    : locations;

  const fetchRoutes = async () => {
    setLoading(true);
    setError('');
    setRoutes([]);
    try {
      const params = new URLSearchParams({
        company,
        suburb,
        location,
        type_column: climbType,
      });
      const res = await fetch(`http://localhost:7071/api/routes?${params.toString()}`, {
        headers: { 'X-Username': username },
      });
      if (!res.ok) throw new Error('Failed to fetch routes');
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const archiveRoute = async (rid) => {
    setError('');
    try {
      console.log("Archiving route with username:", username);
      const res = await fetch('http://localhost:7071/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
        },
        body: JSON.stringify({ action: 'archive', rid }),
      });
      if (!res.ok) throw new Error('Failed to archive route');
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
    setError('');
    try {
      const res = await fetch('http://localhost:7071/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
        },
        body: JSON.stringify(attemptData),
      });
      if (!res.ok) throw new Error('Failed to add attempt');
      setAttemptModalOpen(false);
      setSelectedRoute(null);
      await fetchRoutes();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>View & Manage Routes by Location</h2>
      <div style={{ marginBottom: 16 }}>
        <select
          value={company}
          onChange={e => setCompany(e.target.value)}
          style={{ marginRight: 8 }}
        >
          <option value="">Select Company</option>
          {companies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={suburb}
          onChange={e => setSuburb(e.target.value)}
          style={{ marginRight: 8 }}
          disabled={!company}
        >
          <option value="">Select Gym</option>
          {gyms.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={climbType}
          onChange={e => setClimbType(e.target.value)}
          style={{ marginRight: 8 }}
          disabled={!suburb || climbTypes.length === 0}
        >
          <option value="">Select Climb Type</option>
          {climbTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={location}
          onChange={e => setLocation(e.target.value)}
          style={{ marginRight: 8 }}
          disabled={!climbType}
        >
          <option value="">Select Location</option>
          {filteredLocations.map(l => (
            <option key={l.name} value={l.name}>{l.name}</option>
          ))}
        </select>
        <select value={typeColumn} onChange={e => setTypeColumn(e.target.value)} style={{ display: 'none' }}>
          <option value="Sport">Sport</option>
          <option value="Boulder">Boulder</option>
        </select>
        <button onClick={fetchRoutes} style={{ marginLeft: 12 }} disabled={!(company && suburb && climbType && location)}>
          Fetch Routes
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table border="1" cellPadding="4" style={{ width: '100%', marginTop: 16 }}>
        <thead>
          <tr>
            <th>Grade</th>
            <th>Colour</th>
            {climbType === 'Boulder' && <th>Num Holds</th>}
            <th>Archive</th>
            <th>Add Attempt</th>
          </tr>
        </thead>
        <tbody>
          {routes.map(route => (
            <tr key={route.RID}>
              <td>{route.Grade}</td>
              <td>{route.Colour}</td>
              {climbType === 'Boulder' && <td>{route.NumberHolds}</td>}
              <td>
                <button onClick={() => archiveRoute(route.RID)}>Archive</button>
              </td>
              <td>
                <button onClick={() => handleAddAttemptClick(route)}>Add Attempt</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <AddAttemptModal
        open={attemptModalOpen}
        onClose={() => setAttemptModalOpen(false)}
        onSubmit={handleAttemptSubmit}
        route={selectedRoute || {}}
        defaultAttemptNo={nextAttemptNo}
      />
    </div>
  );
}

export default RoutesByLocation;

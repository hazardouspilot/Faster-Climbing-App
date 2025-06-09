import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function AddGyms({ username }) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [gradeSystems, setGradeSystems] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedGym, setSelectedGym] = useState('');

  // TODO: Add states for form inputs (new company name, country, grade systems, etc.)
  // TODO: Add states for new gym inputs (suburb, city, country)
  // TODO: Add states for new colour inputs
  // TODO: Add states for new location inputs (type, range, individual names)
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCountry, setNewCompanyCountry] = useState('');
  const [selectedBoulderGradeSystem, setSelectedBoulderGradeSystem] = useState('');
  const [selectedSportGradeSystem, setSelectedSportGradeSystem] = useState('');
  const [addCompanyError, setAddCompanyError] = useState('');

  // States for Add New Gym
  const [newGymSuburb, setNewGymSuburb] = useState('');
  const [newGymCity, setNewGymCity] = useState('');
  const [newGymCountry, setNewGymCountry] = useState('');
  const [addGymError, setAddGymError] = useState('');

  // States for Add New Colour
  const [gymsForSelection, setGymsForSelection] = useState([]);
  const [newColourName, setNewColourName] = useState('');
  const [newColourHex, setNewColourHex] = useState('');
  const [addColourError, setAddColourError] = useState('');

  // States for Add New Location(s)
  const [climbTypes, setClimbTypes] = useState([]);
  const [selectedClimbTypeForLocation, setSelectedClimbTypeForLocation] = useState('');
  const [locationNamePrefix, setLocationNamePrefix] = useState('');
  const [locationInputMethod, setLocationInputMethod] = useState('range'); // 'range' or 'individual'
  const [locationRangeStart, setLocationRangeStart] = useState('');
  const [locationRangeEnd, setLocationRangeEnd] = useState('');
  const [locationIndividualNamesString, setLocationIndividualNamesString] = useState('');
  const [addLocationError, setAddLocationError] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCompanies = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const response = await fetch(`https://climbing-backend-functions.azurewebsites.net/api/misc_additions?entity=company`, {
        headers: { 'X-Username': username },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCompanies(data.results || []);
    } catch (e) {
      setError(`Failed to fetch companies: ${e.message}`);
      setCompanies([]);
    }
    setLoading(false);
  }, [username]);

  const fetchGradeSystems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://climbing-backend-functions.azurewebsites.net/api/misc_additions?entity=grade_system`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGradeSystems(data.results || []);
    } catch (e) {
      setError(`Failed to fetch grade systems: ${e.message}`);
      setGradeSystems([]);
    }
    setLoading(false);
  }, []);

  const fetchClimbTypes = useCallback(async () => {
    setLoading(true);
    try {
      // const apiUrl = process.env.REACT_APP_API_URL || 'https://climbing-backend-functions.azurewebsites.net/api';
      const apiUrl = 'https://climbing-backend-functions.azurewebsites.net/api';
      const response = await fetch(`${apiUrl}/misc_additions?entity=climbtype`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClimbTypes(data.results || []);
    } catch (e) {
      setError(`Failed to fetch climb types: ${e.message}`);
      setClimbTypes([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchGradeSystems();
    fetchClimbTypes();
  }, [fetchCompanies, fetchGradeSystems, fetchClimbTypes]);

  const fetchGyms = useCallback(async (companyName) => {
    if (!companyName || !username) {
      setGymsForSelection([]);
      setSelectedGym(''); // Clear selected gym if company is cleared
      return;
    }
    setLoading(true);
    setError(''); // Clear global error
    try {
      // const apiUrl = process.env.REACT_APP_API_URL || 'https://climbing-backend-functions.azurewebsites.net/api';
      const apiUrl = 'https://climbing-backend-functions.azurewebsites.net/api';
      const response = await fetch(`${apiUrl}/misc_additions?entity=gym&company_name=${encodeURIComponent(companyName)}`, {
        headers: { 'X-Username': username },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGymsForSelection(data.results || []);
    } catch (e) {
      setError(`Failed to fetch gyms for ${companyName}: ${e.message}`);
      setGymsForSelection([]);
    }
    setLoading(false);
  }, [username, setSelectedGym]); // Added setSelectedGym to dependencies

  useEffect(() => {
    if (selectedCompany) {
      fetchGyms(selectedCompany);
    } else {
      setGymsForSelection([]); // Clear gyms if no company is selected
      setSelectedGym(''); // Clear selected gym as well
    }
  }, [selectedCompany, fetchGyms, setSelectedGym]); // Added setSelectedGym to dependencies

  const handleReturnHome = () => {
    navigate('/'); // Assuming '/' is the RoutesByLocation page
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim() || !selectedBoulderGradeSystem || !selectedSportGradeSystem) {
      setAddCompanyError('Company Name, Boulder Grade System, and Sport Grade System are required.');
      setSuccessMessage(''); // Clear global success message
      setError(''); // Clear global error message
      return;
    }
    setLoading(true);
    setAddCompanyError('');
    setSuccessMessage(''); // Clear global success message
    setError(''); // Clear global error message

    try {
      const payload = {
        entity: 'company',
        company_name: newCompanyName.trim(),
        primary_country: newCompanyCountry.trim(),
        boulder_grade_system: selectedBoulderGradeSystem,
        sport_grade_system: selectedSportGradeSystem,
      };
      // const apiUrl = process.env.REACT_APP_API_URL || 'https://climbing-backend-functions.azurewebsites.net/api';
      const apiUrl = 'https://climbing-backend-functions.azurewebsites.net/api';
      const response = await fetch(`${apiUrl}/misc_additions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      setSuccessMessage(responseData.message || 'Company added successfully!');
      setNewCompanyName('');
      setNewCompanyCountry('');
      setSelectedBoulderGradeSystem('');
      setSelectedSportGradeSystem('');
      fetchCompanies(); // Refresh company list
    } catch (e) {
      setAddCompanyError(`Failed to add company: ${e.message}`);
    }
    setLoading(false);
  };

  const handleAddGym = async () => {
    if (!selectedCompany) {
      setAddGymError('Please select a company.');
      setSuccessMessage('');
      setError(''); 
      return;
    }
    if (!newGymSuburb.trim()) {
      setAddGymError('Suburb is required for a new gym.');
      setSuccessMessage('');
      setError(''); 
      return;
    }

    setLoading(true);
    setAddGymError('');
    setSuccessMessage('');
    setError('');

    try {
      const payload = {
        entity: 'gym',
        company_name: selectedCompany,
        suburb: newGymSuburb.trim(),
        city: newGymCity.trim(),
        country: newGymCountry.trim(),
      };
      // const apiUrl = process.env.REACT_APP_API_URL || 'https://climbing-backend-functions.azurewebsites.net/api';
      const apiUrl = 'https://climbing-backend-functions.azurewebsites.net/api';
      const response = await fetch(`${apiUrl}/misc_additions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      setSuccessMessage(responseData.message || 'Gym added successfully!');
      // Clear form fields for Add Gym
      setSelectedCompany(''); // Or reset to a default prompt like "Select Company"
      setNewGymSuburb('');
      setNewGymCity('');
      setNewGymCountry('');
      // Potentially refresh a list of gyms if displayed, or just clear form
    } catch (e) {
      setAddGymError(`Failed to add gym: ${e.message}`);
    }
    setLoading(false);
  };

  const handleAddColour = async () => {
    if (!selectedCompany || !selectedGym) {
      setAddColourError('Please select a company and a gym.');
      setSuccessMessage(''); setError('');
      return;
    }
    if (!newColourName.trim() || !newColourHex.trim()) {
      setAddColourError('Colour Name and Hex Code are required.');
      setSuccessMessage(''); setError('');
      return;
    }
    // Basic hex code validation (starts with #, 3 or 6 hex chars)
    if (!/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(newColourHex.trim())) {
        setAddColourError('Invalid Hex Code format. Use #RGB or #RRGGBB.');
        setSuccessMessage(''); setError('');
        return;
    }

    setLoading(true);
    setAddColourError('');
    setSuccessMessage(''); setError('');

    try {
      const payload = {
        entity: 'colour',
        company_name: selectedCompany,
        suburb: selectedGym, // Assuming selectedGym stores the suburb name
        colour_name: newColourName.trim(),
        hex_code: newColourHex.trim(),
      };
      // const apiUrl = process.env.REACT_APP_API_URL || 'https://climbing-backend-functions.azurewebsites.net/api';
      const apiUrl = 'https://climbing-backend-functions.azurewebsites.net/api';
      const response = await fetch(`${apiUrl}/misc_additions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      setSuccessMessage(responseData.message || 'Colour added successfully!');
      setNewColourName('');
      setNewColourHex('');
      // Optionally, clear selectedCompany/selectedGym or refetch colours if displayed
    } catch (e) {
      setAddColourError(`Failed to add colour: ${e.message}`);
    }
    setLoading(false);
  };

  const handleAddLocations = async () => {
    if (!selectedCompany || !selectedGym || !selectedClimbTypeForLocation) {
      setAddLocationError('Company, Gym, and Climb Type are required.');
      setSuccessMessage(''); setError('');
      return;
    }

    let locationNames = [];
    const prefix = locationNamePrefix.trim();

    if (locationInputMethod === 'range') {
      const start = parseInt(locationRangeStart, 10);
      const end = parseInt(locationRangeEnd, 10);
      if (isNaN(start) || isNaN(end) || start <= 0 || end < start) {
        setAddLocationError('Invalid range. Start must be > 0 and End must be >= Start.');
        setSuccessMessage(''); setError('');
        return;
      }
      for (let i = start; i <= end; i++) {
        locationNames.push(prefix ? `${prefix} ${i}` : `${i}`);
      }
    } else if (locationInputMethod === 'individual') {
      if (!locationIndividualNamesString.trim()) {
        setAddLocationError('Please provide at least one individual location name.');
        setSuccessMessage(''); setError('');
        return;
      }
      const names = locationIndividualNamesString.split(',').map(name => name.trim()).filter(name => name);
      if (names.length === 0) {
        setAddLocationError('No valid individual location names provided after trimming.');
        setSuccessMessage(''); setError('');
        return;
      }
      locationNames = names.map(name => prefix ? `${prefix} ${name}` : name);
    } else {
      setAddLocationError('Invalid location input method selected.');
      setSuccessMessage(''); setError('');
      return;
    }

    if (locationNames.length === 0) {
      setAddLocationError('No locations to add. Please check your inputs.');
      setSuccessMessage(''); setError('');
      return;
    }

    setLoading(true);
    setAddLocationError('');
    setSuccessMessage(''); setError('');

    try {
      const payload = {
        entity: 'location',
        company_name: selectedCompany,
        suburb: selectedGym, // Assuming selectedGym stores the suburb name
        type: selectedClimbTypeForLocation,
        locations: locationNames,
      };
      // const apiUrl = process.env.REACT_APP_API_URL || 'https://climbing-backend-functions.azurewebsites.net/api';
      const apiUrl = 'https://climbing-backend-functions.azurewebsites.net/api';
      const response = await fetch(`${apiUrl}/misc_additions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      setSuccessMessage(responseData.message || 'Location(s) added successfully!');
      setLocationNamePrefix('');
      setLocationRangeStart('');
      setLocationRangeEnd('');
      setLocationIndividualNamesString('');
      // Optionally clear selected company/gym/climbtype or refetch data
    } catch (e) {
      setAddLocationError(`Failed to add location(s): ${e.message}`);
    }
    setLoading(false);
  };

  // TODO: Implement resetForm function or logic to clear inputs after successful submission
  // TODO: Implement resetForm function or logic to clear inputs after successful submission

  return (
    <div className="container mt-5">
      <h2>Add New Gym Details</h2>
      <p className="alert alert-info">Please enter new gym details carefully, the usefulness of this app for your fellow climbers relies on you. The details you enter may also be used to contact the gym in future to connect this app to their route database.</p>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {loading && <p>Loading...</p>}

      <button onClick={handleReturnHome} className="btn btn-secondary mb-3">Return to Home</button>

      {/* Section to Add New Company */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Add New Company</h4>
        </div>
        <div className="card-body">
          {addCompanyError && <div className="alert alert-danger mt-2">{addCompanyError}</div>}
          {/* General success message is shown at the top of the page */}
          <div className="mb-3">
            <label htmlFor="newCompanyName" className="form-label">Company Name*</label>
            <input
              type="text"
              className="form-control"
              id="newCompanyName"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="newCompanyCountry" className="form-label">Primary Country</label>
            <input
              type="text"
              className="form-control"
              id="newCompanyCountry"
              value={newCompanyCountry}
              onChange={(e) => setNewCompanyCountry(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="selectedBoulderGradeSystem" className="form-label">Boulder Grade System*</label>
            <select
              className="form-select"
              id="selectedBoulderGradeSystem"
              value={selectedBoulderGradeSystem}
              onChange={(e) => setSelectedBoulderGradeSystem(e.target.value)}
              required
            >
              <option value="">Select Boulder Grade System</option>
              {gradeSystems.map((gs, index) => (
                <option key={`${gs.GradingSystem}-${index}-boulder`} value={gs.GradingSystem}>
                  {gs.GradingSystem}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="selectedSportGradeSystem" className="form-label">Sport Grade System*</label>
            <select
              className="form-select"
              id="selectedSportGradeSystem"
              value={selectedSportGradeSystem}
              onChange={(e) => setSelectedSportGradeSystem(e.target.value)}
              required
            >
              <option value="">Select Sport Grade System</option>
              {gradeSystems.map((gs, index) => (
                <option key={`${gs.GradingSystem}-${index}-sport`} value={gs.GradingSystem}>
                  {gs.GradingSystem}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleAddCompany} className="btn btn-primary" disabled={loading || !username}>
            {loading ? 'Adding...' : 'Add Company'}
          </button>
        </div>
      </div>

      {/* Section to Add New Gym under an Existing Company */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Add New Gym</h4>
        </div>
        <div className="card-body">
          {addGymError && <div className="alert alert-danger mt-2">{addGymError}</div>}
          <div className="mb-3">
            <label htmlFor="selectCompanyForGym" className="form-label">Select Company*</label>
            <select
              className="form-select"
              id="selectCompanyForGym"
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setAddGymError(''); // Clear error when company changes
                setSuccessMessage('');
              }}
              required
            >
              <option value="">Select Company</option>
              {companies.map((company, index) => (
                <option key={`${company.CompanyName}-${index}-forgym`} value={company.CompanyName}>
                  {company.CompanyName}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="newGymSuburb" className="form-label">Suburb*</label>
            <input
              type="text"
              className="form-control"
              id="newGymSuburb"
              value={newGymSuburb}
              onChange={(e) => setNewGymSuburb(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="newGymCity" className="form-label">City</label>
            <input
              type="text"
              className="form-control"
              id="newGymCity"
              value={newGymCity}
              onChange={(e) => setNewGymCity(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="newGymCountry" className="form-label">Country</label>
            <input
              type="text"
              className="form-control"
              id="newGymCountry"
              value={newGymCountry}
              onChange={(e) => setNewGymCountry(e.target.value)}
            />
          </div>
          <button onClick={handleAddGym} className="btn btn-primary" disabled={loading || !username || !selectedCompany}>
            {loading ? 'Adding...' : 'Add Gym'}
          </button>
        </div>
      </div>

      {/* Section to Add New Colour */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Add New Colour</h4>
        </div>
        <div className="card-body">
          {addColourError && <div className="alert alert-danger mt-2">{addColourError}</div>}
          <div className="mb-3">
            <label htmlFor="selectCompanyForColour" className="form-label">Select Company*</label>
            <select
              className="form-select"
              id="selectCompanyForColour"
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value); // This will trigger fetchGyms via useEffect
                setAddColourError(''); setSuccessMessage('');
              }}
              required
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={`${company.CompanyName}-forcolour`} value={company.CompanyName}>
                  {company.CompanyName}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="selectGymForColour" className="form-label">Select Gym*</label>
            <select
              className="form-select"
              id="selectGymForColour"
              value={selectedGym}
              onChange={(e) => {
                setSelectedGym(e.target.value);
                setAddColourError(''); setSuccessMessage('');
              }}
              required
              disabled={!selectedCompany || gymsForSelection.length === 0}
            >
              <option value="">Select Gym</option>
              {gymsForSelection.map((gym) => (
                // Assuming gym object has 'Suburb' as identifier and display value
                <option key={`${gym.Suburb}-forcolour`} value={gym.Suburb}>
                  {gym.Suburb} {gym.City && `(${gym.City})`}
                </option>
              ))}
            </select>
            {selectedCompany && gymsForSelection.length === 0 && !loading && <small className="form-text text-muted">No gyms found for this company, or still loading.</small>}
          </div>
          <div className="mb-3">
            <label htmlFor="newColourName" className="form-label">Colour Name*</label>
            <input
              type="text"
              className="form-control"
              id="newColourName"
              value={newColourName}
              onChange={(e) => setNewColourName(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="newColourHex" className="form-label">Colour Hex Code* (e.g. #FF0000)</label>
            <input
              type="text"
              className="form-control"
              id="newColourHex"
              value={newColourHex}
              onChange={(e) => setNewColourHex(e.target.value)}
              required
              placeholder="#RRGGBB"
            />
          </div>
          <button onClick={handleAddColour} className="btn btn-primary" disabled={loading || !username || !selectedGym}>
            {loading ? 'Adding...' : 'Add Colour'}
          </button>
        </div>
      </div>

      {/* Section to Add New Location(s) */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Add New Location(s)</h4>
        </div>
        <div className="card-body">
          {addLocationError && <div className="alert alert-danger mt-2">{addLocationError}</div>}
          <div className="mb-3">
            <label htmlFor="selectCompanyForLocation" className="form-label">Select Company*</label>
            <select
              className="form-select"
              id="selectCompanyForLocation"
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setAddLocationError(''); setSuccessMessage('');
              }}
              required
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={`${company.CompanyName}-forlocation`} value={company.CompanyName}>
                  {company.CompanyName}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="selectGymForLocation" className="form-label">Select Gym*</label>
            <select
              className="form-select"
              id="selectGymForLocation"
              value={selectedGym}
              onChange={(e) => {
                setSelectedGym(e.target.value);
                setAddLocationError(''); setSuccessMessage('');
              }}
              required
              disabled={!selectedCompany || gymsForSelection.length === 0}
            >
              <option value="">Select Gym</option>
              {gymsForSelection.map((gym) => (
                <option key={`${gym.Suburb}-forlocation`} value={gym.Suburb}>
                  {gym.Suburb} {gym.City && `(${gym.City})`}
                </option>
              ))}
            </select>
            {selectedCompany && gymsForSelection.length === 0 && !loading && <small className="form-text text-muted">No gyms found for this company, or still loading.</small>}
          </div>
          <div className="mb-3">
            <label htmlFor="selectClimbTypeForLocation" className="form-label">Select Climb Type*</label>
            <select
              className="form-select"
              id="selectClimbTypeForLocation"
              value={selectedClimbTypeForLocation}
              onChange={(e) => {
                setSelectedClimbTypeForLocation(e.target.value);
                setAddLocationError(''); setSuccessMessage('');
              }}
              required
              disabled={!selectedGym}
            >
              <option value="">Select Climb Type</option>
              {climbTypes.map((ct, index) => (
                <option key={`${ct.ClimbType}-${index}-forlocation`} value={ct.ClimbType}>
                  {ct.ClimbType}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="locationNamePrefix" className="form-label">Location Name Prefix (Optional)</label>
            <input
              type="text"
              className="form-control"
              id="locationNamePrefix"
              value={locationNamePrefix}
              onChange={(e) => setLocationNamePrefix(e.target.value)}
              placeholder="e.g., Wall, Sector A - Face"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Location Input Method*</label>
            <div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="locationInputMethod" id="rangeMethod" value="range" checked={locationInputMethod === 'range'} onChange={() => setLocationInputMethod('range')} />
                <label className="form-check-label" htmlFor="rangeMethod">Numerical Range</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="locationInputMethod" id="individualMethod" value="individual" checked={locationInputMethod === 'individual'} onChange={() => setLocationInputMethod('individual')} />
                <label className="form-check-label" htmlFor="individualMethod">Individual Names</label>
              </div>
            </div>
          </div>

          {locationInputMethod === 'range' && (
            <div className="row mb-3">
              <div className="col">
                <label htmlFor="locationRangeStart" className="form-label">Range Start*</label>
                <input type="number" className="form-control" id="locationRangeStart" value={locationRangeStart} onChange={(e) => setLocationRangeStart(e.target.value)} placeholder="e.g., 1" />
              </div>
              <div className="col">
                <label htmlFor="locationRangeEnd" className="form-label">Range End*</label>
                <input type="number" className="form-control" id="locationRangeEnd" value={locationRangeEnd} onChange={(e) => setLocationRangeEnd(e.target.value)} placeholder="e.g., 10" />
              </div>
            </div>
          )}

          {locationInputMethod === 'individual' && (
            <div className="mb-3">
              <label htmlFor="locationIndividualNamesString" className="form-label">Individual Names (comma-separated)*</label>
              <textarea className="form-control" id="locationIndividualNamesString" rows="3" value={locationIndividualNamesString} onChange={(e) => setLocationIndividualNamesString(e.target.value)} placeholder="e.g., The Slab, The Arch, Overhang"></textarea>
            </div>
          )}

          <button onClick={handleAddLocations} className="btn btn-primary" disabled={loading || !username || !selectedClimbTypeForLocation}>
            {loading ? 'Adding...' : 'Add Location(s)'}
          </button>
        </div>
      </div>

      <hr />
      <h4>Existing Companies:</h4>
      {companies.length > 0 ? (
        <ul>
          {companies.map((company, index) => (
            <li key={index}>{company.CompanyName}</li>
          ))}
        </ul>
      ) : (
        <p>No companies found or yet to load.</p>
      )}

      <h4>Available Grade Systems:</h4>
      {gradeSystems.length > 0 ? (
        <ul>
          {gradeSystems.map((system, index) => (
            <li key={index}>{system.GradingSystem}</li>
          ))}
        </ul>
      ) : (
        <p>No grade systems found or yet to load.</p>
      )}

    </div>
  );
}

export default AddGyms;

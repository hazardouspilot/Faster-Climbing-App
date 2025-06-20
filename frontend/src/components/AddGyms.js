import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function AddGyms({ username }) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [gradeSystems, setGradeSystems] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedGym, setSelectedGym] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCountry, setNewCompanyCountry] = useState('');
  const [selectedBoulderGradeSystem, setSelectedBoulderGradeSystem] = useState('');
  const [selectedSportGradeSystem, setSelectedSportGradeSystem] = useState('');
  const [addCompanyError, setAddCompanyError] = useState('');
  const [newGymSuburb, setNewGymSuburb] = useState('');
  const [newGymCity, setNewGymCity] = useState('');
  const [newGymCountry, setNewGymCountry] = useState('');
  const [addGymError, setAddGymError] = useState('');
  const [gymsForSelection, setGymsForSelection] = useState([]);
  const [newColourName, setNewColourName] = useState('');
  const [addColourError, setAddColourError] = useState('');
  // Hardcoded climb types for location addition
  const climbTypes = ['Sport', 'Boulder', 'Speed'];
  const [selectedClimbTypeForLocation, setSelectedClimbTypeForLocation] = useState('');
  const [locationInputMethod, setLocationInputMethod] = useState('range');
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

  // Fetch gyms for a company, return an array of suburb strings (like RoutesByLocation)
  const fetchGyms = useCallback(async (companyName) => {
    if (!companyName || !username) {
      setGymsForSelection([]);
      setSelectedGym('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const apiUrl = 'https://climbing-backend-functions.azurewebsites.net/api';
      const response = await fetch(`${apiUrl}/misc_additions?entity=gym&company=${encodeURIComponent(companyName)}`, {
        headers: { 'X-Username': username },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Map to array of suburb strings for dropdown compatibility
      setGymsForSelection((data.results || []).map(g => g.Suburb));
    } catch (e) {
      setError(`Failed to fetch gyms for ${companyName}: ${e.message}`);
      setGymsForSelection([]);
    }
    setLoading(false);
  }, [username]);

  useEffect(() => {
    fetchCompanies();
    fetchGradeSystems();
    // Do NOT fetch climb types here; only fetch after gym is selected
  }, [fetchCompanies, fetchGradeSystems]);

  // Fetch gyms when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      fetchGyms(selectedCompany);
    } else {
      setGymsForSelection([]);
      setSelectedGym('');
    }
  }, [selectedCompany, fetchGyms]);

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
        data: {
          companyName: newCompanyName.trim(),
          boulderGradeSystem: selectedBoulderGradeSystem,
          sportGradeSystem: selectedSportGradeSystem,
          primaryCountry: newCompanyCountry.trim(),
        }
      };
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
        data: {
          companyName: selectedCompany,
          suburb: newGymSuburb.trim(),
          city: newGymCity.trim(),
          country: newGymCountry.trim(),
        }
      };
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
      setNewGymSuburb('');
      setNewGymCity('');
      setNewGymCountry('');
      fetchGyms(selectedCompany);
    } catch (e) {
      setAddGymError(`Failed to add gym: ${e.message}`);
    }
    setLoading(false);
  };

  const handleAddColour = async () => {
    if (!selectedCompany) {
      setAddColourError('Please select a company.');
      setSuccessMessage(''); setError('');
      return;
    }
    if (!newColourName.trim()) {
      setAddColourError('Colour Name is required.');
      setSuccessMessage(''); setError('');
      return;
    }
    setLoading(true);
    setAddColourError('');
    setSuccessMessage(''); setError('');

    try {
      const payload = {
        entity: 'colour',
        data: {
          companyName: selectedCompany,
          colour: newColourName.trim(),
        }
      };
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

    if (locationInputMethod === 'range') {
      const start = parseInt(locationRangeStart, 10);
      const end = parseInt(locationRangeEnd, 10);
      if (isNaN(start) || isNaN(end) || start <= 0 || end < start) {
        setAddLocationError('Invalid range. Start must be > 0 and End must be >= Start.');
        setSuccessMessage(''); setError('');
        return;
      }
      for (let i = start; i <= end; i++) {
        locationNames.push(`${i}`);
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
      locationNames = names;
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
      // Build array of location objects with type for backend
      const locationsPayload = locationNames.map(loc => ({
        location: loc,
        type: selectedClimbTypeForLocation,
      }));
      const payload = {
        entity: 'location',
        companyName: selectedCompany,
        suburb: selectedGym, // selectedGym stores the suburb name
        data: locationsPayload,
      };

      console.log('Submitting locations payload:', payload);
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
      setLocationRangeStart('');
      setLocationRangeEnd('');
      setLocationIndividualNamesString('');
      setSelectedGym('');
      setSelectedClimbTypeForLocation('');
    } catch (e) {
      setAddLocationError(`Failed to add location(s): ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <h2>Add New Gym Details</h2>
      <p className="alert alert-info">Please enter details carefully, the usefulness of this app for your fellow climbers relies on you.</p>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {loading && <p>Loading...</p>}

      <button onClick={handleReturnHome} className="btn btn-secondary mb-3">Return to Home</button>

      {/* Section to Add New Company */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Option 1: Add a New Company</h4>
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

      {/* Step 2: Select Company */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Option 2: Select an existing Company to add a Gym, Colours or Locations</h4>
        </div>
        <div className="card-body">
          <p>Note: Gyms named according to their suburb.</p>
          <select
            className="form-select mb-3"
            value={selectedCompany}
            onChange={e => {
              setSelectedCompany(e.target.value);
              setSelectedGym('');
              setSuccessMessage('');
              setError('');
            }}
          >
            <option value="">Select Company</option>
            {companies.map((company, index) => (
              <option key={`${company.CompanyName}-${index}`} value={company.CompanyName}>{company.CompanyName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Gym and Add Colour - only if a company is selected */}
      {selectedCompany && (
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header"><h4>Add New Gym/Suburb</h4></div>
              <div className="card-body">
                {addGymError && <div className="alert alert-danger mt-2">{addGymError}</div>}
                <div className="mb-3">
                  <label htmlFor="newGymSuburb" className="form-label">Suburb*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newGymSuburb"
                    value={newGymSuburb}
                    onChange={e => setNewGymSuburb(e.target.value)}
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
                    onChange={e => setNewGymCity(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newGymCountry" className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newGymCountry"
                    value={newGymCountry}
                    onChange={e => setNewGymCountry(e.target.value)}
                  />
                </div>
                <button onClick={handleAddGym} className="btn btn-primary" disabled={loading || !username}>
                  {loading ? 'Adding...' : 'Add Gym'}
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header"><h4>Add New Colour</h4></div>
              <div className="card-body">
                {addColourError && <div className="alert alert-danger mt-2">{addColourError}</div>}
                <div className="mb-3">
                  <label htmlFor="newColourName" className="form-label">Colour Name*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newColourName"
                    value={newColourName}
                    onChange={e => setNewColourName(e.target.value)}
                    required
                  />
                </div>
                <button onClick={handleAddColour} className="btn btn-primary" disabled={loading || !username}>
                  {loading ? 'Adding...' : 'Add Colour'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Select Gym for Adding Locations */}
      {selectedCompany && (
        <div className="card mb-4">
          <div className="card-header"><h4>Step 3: Select Gym for Locations</h4></div>
          <div className="card-body">
            <p>If you would like to add new locations for a specific gym, select the relevant gym.</p>
            <select
              className="form-control"
              value={selectedGym}
              onChange={e => setSelectedGym(e.target.value)}
              disabled={!selectedCompany || gymsForSelection.length === 0}
            >
              <option value="">Select Gym (Suburb)</option>
              {gymsForSelection.map((suburb, idx) => (
                <option key={idx} value={suburb}>
                  {suburb}
                </option>
              ))}
            </select>
            {selectedCompany && gymsForSelection.length === 0 && !loading && <small className="form-text text-muted">No gyms found for this company, or still loading.</small>}
          </div>
        </div>
      )}

      {/* Add Location(s) Section - only if a gym is selected */}
      {selectedCompany && selectedGym && (
        <div className="card mb-4">
          <div className="card-header"><h4>Add New Location(s)</h4></div>
          <div className="card-body">
            {addLocationError && <div className="alert alert-danger mt-2">{addLocationError}</div>}
            <div className="mb-3">
              <label htmlFor="selectClimbTypeForLocation" className="form-label">Select Climb Type*</label>
              <select
                className="form-select"
                id="selectClimbTypeForLocation"
                value={selectedClimbTypeForLocation}
                onChange={e => {
                  setSelectedClimbTypeForLocation(e.target.value);
                  setAddLocationError(''); setSuccessMessage('');
                }}
                required
              >
                <option value="">Select Climb Type</option>
                {climbTypes.map((ct, index) => (
                  <option key={`${ct}-${index}-forlocation`} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
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
                  <input type="number" className="form-control" id="locationRangeStart" value={locationRangeStart} onChange={e => setLocationRangeStart(e.target.value)} placeholder="e.g., 1" />
                </div>
                <div className="col">
                  <label htmlFor="locationRangeEnd" className="form-label">Range End*</label>
                  <input type="number" className="form-control" id="locationRangeEnd" value={locationRangeEnd} onChange={e => setLocationRangeEnd(e.target.value)} placeholder="e.g., 10" />
                </div>
              </div>
            )}

            {locationInputMethod === 'individual' && (
              <div className="mb-3">
                <label htmlFor="locationIndividualNamesString" className="form-label">Individual Names (comma-separated)*</label>
                <textarea className="form-control" id="locationIndividualNamesString" rows="3" value={locationIndividualNamesString} onChange={e => setLocationIndividualNamesString(e.target.value)} placeholder="e.g., The Slab, The Arch, Overhang"></textarea>
              </div>
            )}

            <button onClick={handleAddLocations} className="btn btn-primary" disabled={loading || !username || !selectedClimbTypeForLocation}>
              {loading ? 'Adding...' : 'Add Location(s)'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default AddGyms;
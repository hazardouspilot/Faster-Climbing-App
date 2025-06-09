import React, { useEffect, useState } from "react";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/get_users`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching users:", err);
      });
  }, []);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error loading users: {error}</p>;

  return (
    <div>
      <h2>Climbers</h2>
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.username}>
              {user.firstName} {user.lastName} ({user.username})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Users;

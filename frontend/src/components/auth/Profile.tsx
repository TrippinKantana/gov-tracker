import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading user profile...</div>
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <div className="space-y-2">
        <div><strong>Name:</strong> {user.name}</div>
        <div><strong>Email:</strong> {user.email}</div>
        {user.department && <div><strong>Department:</strong> {user.department}</div>}
        {user.clearanceLevel && <div><strong>Clearance Level:</strong> {user.clearanceLevel}</div>}
        {user.roles.length > 0 && (
          <div>
            <strong>Roles:</strong>
            <ul className="list-disc list-inside ml-2">
              {user.roles.map((role, index) => (
                <li key={index}>{role}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile

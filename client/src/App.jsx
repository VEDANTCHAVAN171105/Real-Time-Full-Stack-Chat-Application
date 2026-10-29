import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import {Toaster} from "react-hot-toast"
import { AuthContext } from '../context/AuthContextValue'
import backgroundImage from './assets/bgImage.svg'

const App = () => {

  const { authUser, authLoading } = useContext(AuthContext)

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white" role="status">Loading...</div>
  }

  return (
    <div className="bg-contain" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <Toaster/>
      <Routes>
        <Route path='/' element ={authUser ? <HomePage/> : <Navigate to="/login" />}/>
        <Route path='/login' element={authUser ? <Navigate to="/" /> : <LoginPage />}/>
        <Route path='/profile' element ={authUser ? <ProfilePage/> : <Navigate to="/login" />}/>
      </Routes>
    </div>
  )
}

export default App
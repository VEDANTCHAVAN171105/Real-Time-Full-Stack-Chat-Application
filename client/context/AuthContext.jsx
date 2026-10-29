import { useCallback, useEffect, useRef, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import {io} from "socket.io-client"
import { AuthContext } from "./AuthContextValue";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({children})=>{

    const[authUser, setAuthUser] = useState(null);
    const[authLoading, setAuthLoading] = useState(true);
    const[onlineUsers, setOnlineUsers] = useState([]);
    const[socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    //Connect Socket function to handle socket connection and online users update
    const connectSocket = useCallback((userData)=>{
        if(!userData || socketRef.current?.connected) return;
        const newSocket = io(backendUrl, {
            query:{
                userId: userData._id,
            }
        });
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds)=>{
            setOnlineUsers(userIds);
        })
    }, []);

    // Check if user is authenticated and if so, set the user data and connect the socket 
    const checkAuth = useCallback(async(authToken)=>{
        if(authToken){
            try{
                const{data} = await axios.get("/api/auth/check");
                if(data.success){
                    setAuthUser(data.user)
                    connectSocket(data.user)
                } else {
                    throw new Error(data.message || "Authentication failed");
                }
            }catch(error){
                localStorage.removeItem("token");
                delete axios.defaults.headers.common["token"];
                if(error.response?.status !== 401){
                    toast.error(error.response?.data?.message || error.message);
                }
            }
        }
        setAuthLoading(false);
    }, [connectSocket]);

    useEffect(()=>{
        const storedToken = localStorage.getItem("token");
        if(storedToken){
            axios.defaults.headers.common["token"] = storedToken;
        }
        checkAuth(storedToken);
    },[checkAuth])

    //Login Fuction to Handle User Auth And Socktet Connection
    const login = async(state, credentials)=>{
        try{
            const{data} = await axios.post(`/api/auth/${state}`, credentials);
            if(data.success){
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common['token'] = data.token;
                localStorage.setItem("token", data.token)
                toast.success(data.message)
                return true;
            }else{
                toast.error(data.message)
                return false;
            }
        }catch(error){
            const message = error.response?.data?.message ||
                (error.code === "ERR_NETWORK"
                    ? "Cannot reach the server. Make sure the backend is running and VITE_BACKEND_URL is correct."
                    : error.message);
            toast.error(message)
            return false;
        }
    }

    //LogOut Fuction to Handle User Auth And Socktet Connection
    const logout = async()=>{
        localStorage.removeItem("token")
        setAuthUser(null);
        setOnlineUsers([]);
        delete axios.defaults.headers.common["token"];
        toast.success("Logged Out Successfully")
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocket(null);
    }

    //Update profile function to handle user profile updates
    const updateProfile = async(body)=>{
        try{
            const {data} = await axios.put("/api/auth/update-profile", body)
            if(data.success){
                setAuthUser(data.user);
                toast.success("Profile Updated Successfully")
            }
        }catch(error){
            toast.error(error.message)
        }
    }

    const value = {
        axios,
        authUser,
        authLoading,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
    }

    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
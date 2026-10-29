import { useCallback, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContextValue";
import toast from "react-hot-toast";
import { ChatContext } from "./ChatContextValue";

export const ChatProvider = ({children})=>{

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const[selectedUser, setSelectedUser] = useState(null)
    const[unseenMessages, setUnseenMessages] = useState({})

    const {socket, axios} = useContext(AuthContext);

    //Function To Get All Users From Side Bar
    const getUsers = useCallback(async()=>{
        try{    
           const {data} = await axios.get("/api/messages/users")
           if(data.success){
            setUsers(data.users)
            setUnseenMessages(data.unseenMessages)

           }

        }catch(error){
            toast.error(error.message)
        }
    }, [axios])

    //Function To Get Messsages For Selected User
    const getMessages = useCallback(async(userID)=>{
        try{
            const { data } = await axios.get(`/api/messages/${userID}`);
            if(data.success){
                setMessages(data.messages)
            }
        }catch(error){
            toast.error(error.message)
        }
    }, [axios])

    //Function To Send Message To Selected user
    const sendMessage = useCallback(async(messageData)=>{
        try{
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if(data.success){
                setMessages((prevMessages)=>[...prevMessages, data.newMessage])
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.message);
        }
    }, [axios, selectedUser])

    useEffect(()=>{
        if(!socket) return undefined;
        const handleNewMessage = (newMessage)=>{
            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true;
                setMessages((prevMessages)=>[...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }else{
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages, [newMessage.senderId] : prevUnseenMessages[newMessage.senderId] 
                    ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        };
        socket.on("newMessage", handleNewMessage);
        return()=> socket.off("newMessage", handleNewMessage);
    },[axios, socket, selectedUser])
    

    const value ={
        messages, users, selectedUser, getUsers, getMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages
    }

    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}
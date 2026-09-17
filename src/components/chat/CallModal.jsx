"use client"

import { useState, useEffect, useRef } from "react"
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react"

export default function CallModal({ callData, onEnd }) {
  const [status, setStatus] = useState(() => callData.isIncoming ? "RINGING" : "CALLING")
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnection = useRef(null)

  useEffect(() => {
    const currentPeer = peerConnection.current
    // --- WebRTC Logic Placeholder ---
    // 1. Get User Media
    // 2. Create PeerConnection
    // 3. Handle Offer/Answer via Socket
    // 4. Handle ICE Candidates
    
    return () => {
      // Cleanup streams and peer connection
      currentPeer?.close()
    }
  }, [callData])

  const handleAccept = () => {
    setStatus("ONGOING")
    // Emit call:accept
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6">
      <div className="w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col items-center py-12 px-8">
        
        {/* Profile Circle */}
        <div className="relative mb-8">
          <div className="h-32 w-32 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center overflow-hidden animate-pulse">
            <span className="text-4xl font-bold text-slate-500">
              {callData.remoteUser?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-full border-4 border-slate-900">
            {callData.type === 'VIDEO' ? <Video size={20} className="text-white"/> : <Mic size={20} className="text-white"/>}
          </div>
        </div>

        <h2 className="text-2xl font-black text-white mb-2">{callData.remoteUser?.fullName || 'Fixam User'}</h2>
        <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-12">{status}</p>

        {/* Video Containers (Hidden if Audio) */}
        {callData.type === 'VIDEO' && (
          <div className="w-full grid grid-cols-2 gap-4 mb-12 h-48">
            <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative">
              <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded">You</div>
            </div>
            <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative">
              <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded">{callData.remoteUser?.fullName}</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-5 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            {isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
          </button>

          {status === "RINGING" ? (
            <button 
              onClick={handleAccept}
              className="bg-emerald-500 h-16 w-16 rounded-full flex items-center justify-center text-white hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
            >
              <Phone size={28}/>
            </button>
          ) : (
             <button 
              onClick={onEnd}
              className="bg-red-500 h-16 w-16 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
            >
              <PhoneOff size={28}/>
            </button>
          )}

          {callData.type === 'VIDEO' && (
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-5 rounded-full transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {isVideoOff ? <VideoOff size={24}/> : <Video size={24}/>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

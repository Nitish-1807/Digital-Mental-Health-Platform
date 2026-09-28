import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import styles from '../styles/videoComponent.module.css';
import { useAuth } from '../context/AuthContext';
import { videoAPI } from '../services/api';

const serverUrl = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const peerConfigConnections = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

export default function VideoMeetComponent() {
  const { room } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const normalizedRoom = useMemo(() => String(room || '').trim().toUpperCase(), [room]);

  const socketRef = useRef(null);
  const socketIdRef = useRef('');
  const localVideoref = useRef(null);
  const videoRef = useRef([]);
  const connectionsRef = useRef({});

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showModal, setModal] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [newMessages, setNewMessages] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    setDisplayName(user?.name || 'Guest');
  }, [user?.name]);

  useEffect(() => {
    getPermissions();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      Object.values(connectionsRef.current).forEach((connection) => {
        try {
          connection.close();
        } catch {
          // no-op
        }
      });
      connectionsRef.current = {};

      try {
        window.localStream?.getTracks()?.forEach((track) => track.stop());
      } catch {
        // no-op
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, isReady, video]);

  useEffect(() => {
    if (isReady) {
      getDisplayMedia();
    }
  }, [isReady, screen]);

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoPermission) {
        setVideoAvailable(true);
        videoPermission.getTracks().forEach((track) => track.stop());
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioPermission) {
        setAudioAvailable(true);
        audioPermission.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setVideoAvailable(false);
      setAudioAvailable(false);
    }

    setScreenAvailable(Boolean(navigator.mediaDevices?.getDisplayMedia));
  };

  const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    const stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const silence = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const syncLocalStreamToPeers = () => {
    Object.entries(connectionsRef.current).forEach(([id, connection]) => {
      if (id === socketIdRef.current || !window.localStream) {
        return;
      }

      try {
        connection.addStream(window.localStream);
      } catch {
        // no-op
      }

      connection.createOffer()
        .then((description) => connection.setLocalDescription(description))
        .then(() => {
          socketRef.current?.emit(
            'signal',
            id,
            JSON.stringify({ sdp: connectionsRef.current[id].localDescription })
          );
        })
        .catch((error) => console.error(error));
    });
  };

  const applyLocalStream = (stream) => {
    try {
      window.localStream?.getTracks()?.forEach((track) => track.stop());
    } catch {
      // no-op
    }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    syncLocalStreamToPeers();

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        if (track.kind === 'video' && screen) {
          setScreen(false);
          getUserMedia();
          return;
        }

        if (track.kind === 'video') {
          setVideo(false);
        }
        if (track.kind === 'audio') {
          setAudio(false);
        }

        const fallbackStream = new MediaStream([black(), silence()]);
        applyLocalStream(fallbackStream);
      };
    });
  };

  const getUserMedia = async () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video && videoAvailable,
          audio: audio && audioAvailable
        });
        applyLocalStream(stream);
        return;
      } catch (error) {
        console.error(error);
      }
    }

    const fallbackStream = new MediaStream([black(), silence()]);
    applyLocalStream(fallbackStream);
  };

  const getDisplayMedia = async () => {
    if (!screen || !navigator.mediaDevices?.getDisplayMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      applyLocalStream(stream);
    } catch (error) {
      console.error(error);
      setScreen(false);
    }
  };

  const ensurePeerConnection = (participant) => {
    if (connectionsRef.current[participant.socketId]) {
      return connectionsRef.current[participant.socketId];
    }

    const connection = new RTCPeerConnection(peerConfigConnections);

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit(
          'signal',
          participant.socketId,
          JSON.stringify({ ice: event.candidate })
        );
      }
    };

    connection.onaddstream = (event) => {
      const participantName = participant.displayName || 'Participant';
      const existing = videoRef.current.find((item) => item.socketId === participant.socketId);

      if (existing) {
        const updated = videoRef.current.map((item) =>
          item.socketId === participant.socketId ? { ...item, stream: event.stream, name: participantName } : item
        );
        videoRef.current = updated;
        setVideos(updated);
      } else {
        const updated = [
          ...videoRef.current,
          {
            socketId: participant.socketId,
            stream: event.stream,
            name: participantName
          }
        ];
        videoRef.current = updated;
        setVideos(updated);
      }
    };

    if (window.localStream) {
      connection.addStream(window.localStream);
    } else {
      const fallbackStream = new MediaStream([black(), silence()]);
      window.localStream = fallbackStream;
      connection.addStream(window.localStream);
    }

    connectionsRef.current[participant.socketId] = connection;
    return connection;
  };

  const gotMessageFromServer = (fromId, messagePayload) => {
    const signal = JSON.parse(messagePayload);
    const connection = connectionsRef.current[fromId];

    if (!connection || fromId === socketIdRef.current) {
      return;
    }

    if (signal.sdp) {
      connection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === 'offer') {
            return connection.createAnswer()
              .then((description) => connection.setLocalDescription(description))
              .then(() => {
                socketRef.current?.emit(
                  'signal',
                  fromId,
                  JSON.stringify({ sdp: connection.localDescription })
                );
              });
          }
          return null;
        })
        .catch((error) => console.error(error));
    }

    if (signal.ice) {
      connection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((error) => console.error(error));
    }
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [...prevMessages, { sender, data }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  const connectToSocketServer = async () => {
    try {
      await videoAPI.addToHistory(normalizedRoom);
    } catch (error) {
      console.error('Failed to store meeting history:', error);
    }

    const token = localStorage.getItem('token');
    socketRef.current = io(serverUrl, {
      auth: { token }
    });

    socketRef.current.on('signal', gotMessageFromServer);
    socketRef.current.on('chat-message', addMessage);
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection failed:', error.message);
    });

    socketRef.current.on('connect', () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit('join-call', {
        roomCode: normalizedRoom,
        displayName: displayName || user?.name || 'Guest'
      });
    });

    socketRef.current.on('user-left', (id) => {
      setVideos((prevVideos) => {
        const updated = prevVideos.filter((entry) => entry.socketId !== id);
        videoRef.current = updated;
        return updated;
      });

      if (connectionsRef.current[id]) {
        try {
          connectionsRef.current[id].close();
        } catch {
          // no-op
        }
        delete connectionsRef.current[id];
      }
    });

    socketRef.current.on('user-joined', (id, participants) => {
      participants.forEach((participant) => {
        if (participant.socketId === socketIdRef.current) {
          return;
        }
        ensurePeerConnection(participant);
      });

      if (id === socketIdRef.current) {
        Object.entries(connectionsRef.current).forEach(([participantId, connection]) => {
          if (participantId === socketIdRef.current) {
            return;
          }

          try {
            connection.addStream(window.localStream);
          } catch {
            // no-op
          }

          connection.createOffer()
            .then((description) => connection.setLocalDescription(description))
            .then(() => {
              socketRef.current?.emit(
                'signal',
                participantId,
                JSON.stringify({ sdp: connection.localDescription })
              );
            })
            .catch((error) => console.error(error));
        });
      }
    });
  };

  const handleVideo = () => {
    setVideo((prev) => !prev);
  };

  const handleAudio = () => {
    setAudio((prev) => !prev);
  };

  const handleScreen = () => {
    setScreen((prev) => !prev);
  };

  const handleEndCall = () => {
    try {
      window.localStream?.getTracks()?.forEach((track) => track.stop());
    } catch {
      // no-op
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    navigate('/video/join');
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !socketRef.current) {
      return;
    }

    socketRef.current.emit('chat-message', trimmedMessage, displayName || user?.name || 'Guest');
    setMessage('');
  };

  const connect = async () => {
    setIsReady(true);
    await connectToSocketServer();
  };

  if (!normalizedRoom) {
    return null;
  }

  return (
    <div>
      {!isReady ? (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-indigo-500 mb-3">Video Session</p>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Ready to join room {normalizedRoom}?</h2>
            <p className="text-gray-500 mb-6">
              Your camera and microphone will be prepared before you enter the live counselling room.
            </p>

            <TextField
              fullWidth
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                Camera: <span className="font-semibold">{videoAvailable ? 'Ready' : 'Unavailable'}</span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                Mic: <span className="font-semibold">{audioAvailable ? 'Ready' : 'Unavailable'}</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="outlined" onClick={() => navigate('/video/join')} fullWidth>
                Back
              </Button>
              <Button variant="contained" onClick={connect} fullWidth>
                Enter room
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1>Room Chat</h1>
                    <p className="text-xs text-gray-400 mt-1">Meeting code: {normalizedRoom}</p>
                  </div>
                  <button onClick={() => setModal(false)} className="text-xs font-semibold text-gray-500">
                    Hide
                  </button>
                </div>

                <div className={styles.chattingDisplay}>
                  {messages.length !== 0 ? (
                    messages.map((item, index) => (
                      <div style={{ marginBottom: '20px' }} key={`${item.sender}-${index}`}>
                        <p style={{ fontWeight: 'bold' }}>{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No messages yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="meeting-chat-input"
                    label="Enter your message"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>Send</Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: 'white' }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: 'red' }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: 'white' }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable ? (
              <IconButton onClick={handleScreen} style={{ color: 'white' }}>
                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            ) : null}

            <Badge badgeContent={newMessages} max={999} color="warning">
              <IconButton
                onClick={() => {
                  setModal((prev) => !prev);
                  setNewMessages(0);
                }}
                style={{ color: 'white' }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <div className="absolute top-5 left-5 z-10 rounded-2xl bg-black/30 text-white px-4 py-2 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.25em] opacity-70">Meeting code</p>
            <p className="font-bold text-lg">{normalizedRoom}</p>
          </div>

          <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted />

          <div className={styles.conferenceView}>
            {videos.map((entry) => (
              <div key={entry.socketId} className={styles.participantCard}>
                <video
                  data-socket={entry.socketId}
                  ref={(ref) => {
                    if (ref && entry.stream) {
                      ref.srcObject = entry.stream;
                    }
                  }}
                  autoPlay
                />
                <div className="absolute bottom-4 left-4 rounded-xl bg-black/40 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                  {entry.name || 'Participant'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

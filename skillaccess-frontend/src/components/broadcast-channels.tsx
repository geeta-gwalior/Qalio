"use client";

import { useEffect, useRef, useState } from "react";
import { Hash, Briefcase, FileText, Search, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { getCookie } from "@/utils/getCookie";
import { io } from "socket.io-client";

const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
  {
    path: "/qalio/socket.io",
    transports: ["websocket"],
  }
);

interface Props {
  userRole: string;
  userId: string;
}

interface Message {
  _id: string;
  content: string;
  sender: { _id: string; name: string; role: string };
  createdAt: string;
  roomId?: string;
  roomType?: string;
  recipients: string[];
  readBy: string[];
}

interface Assessment {
  _id: string;
  name: string;
}

interface CompanyJob {
  jobTitle: any;
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  postedDate: string;
  status: "active" | "draft" | "closed";
  applicants: number;
  assessment: Assessment | null;
}

interface Channel {
  id: string;
  name: string;
  type: "job" | "assessment" | "general";
  displayName: string;
  assessmentId?: string;
  jobId?: string;
}

const staticChannels: Channel[] = [
  {
    id: "job-announcements",
    name: "job-announcements",
    type: "general",
    displayName: "Job Announcements",
  },
];

export default function BroadcastChannels({ userRole, userId }: Props) {
  const [activeChannel, setActiveChannel] = useState("job-announcements");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [companyJobs, setCompanyJobs] = useState<CompanyJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [channels, setChannels] = useState<Channel[]>(staticChannels);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const activeChannelData = channels.find((c) => c.id === activeChannel);
  const previousChannel = useRef<string | null>(null);

  const getRoomId = () => {
    if (
      activeChannelData?.type === "assessment" &&
      activeChannelData.assessmentId
    ) {
      return activeChannelData.assessmentId;
    }
    if (activeChannelData?.type === "job" && activeChannelData.assessmentId) {
      // For job channels, use assessment ID as room ID
      return activeChannelData.assessmentId;
    }
    return "global";
  };

  // Fetch company jobs (only for company users)
  const fetchCompanyJobs = async () => {
    if (userRole !== "company") return;

    const token = getCookie("jwt");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/company`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const jobs = response.data.jobs;
        setCompanyJobs(jobs);

        // Create job channels for company users with assessment names (only for jobs with assessments)
        const jobChannels: Channel[] = jobs
          .filter((job: CompanyJob) => job.assessment) // Only jobs with assessments
          .map((job: CompanyJob) => ({
            id: `job-${job._id}`,
            name: `${job.jobTitle} (${job.assessment!.name})`,
            type: "job" as const,
            displayName: `${job.jobTitle} (${job.assessment!.name})`,
            jobId: job._id,
            assessmentId: job.assessment!._id,
          }));

        // Update channels with job channels for company users
        setChannels([...staticChannels, ...jobChannels]);

        // Join all rooms for real-time updates - using assessment-updates for job channels
        const roomsToJoin = [
          { roomType: "job-announcements", roomId: "global" },
          ...jobChannels.map((channel) => ({
            roomType: "assessment-updates", // Use assessment-updates for job channels
            roomId: channel.assessmentId!,
          })),
        ];

        roomsToJoin.forEach((room) => {
          socket.emit("join_room", room);
        });
      }
    } catch (error) {
      console.error("Failed to fetch company jobs:", error);
    }
  };

  // Fetch assessments (for non-company users)
  const fetchAssessments = async () => {
    if (userRole === "company") return;

    const token = getCookie("jwt");
    try {
      const endpoint =
        userRole === "student"
          ? `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/invited`
          : `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/my`;

      const res = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fetchedAssessments = res.data.assessments;
      setAssessments(fetchedAssessments);

      const assessmentChannels: Channel[] = fetchedAssessments.map(
        (assessment: Assessment) => ({
          id: `assessment-${assessment._id}`,
          name: assessment.name,
          type: "assessment" as const,
          displayName: assessment.name,
          assessmentId: assessment._id,
        })
      );

      setChannels([...staticChannels, ...assessmentChannels]);

      // Join all assessment and job rooms
      const roomsToJoin = [
        { roomType: "job-announcements", roomId: "global" },
        ...assessmentChannels.map((channel) => ({
          roomType: "assessment-updates",
          roomId: channel.assessmentId!,
        })),
      ];

      roomsToJoin.forEach((room) => {
        socket.emit("join_room", room);
      });
    } catch (err) {
      console.error("Failed to fetch assessments", err);
    }
  };

  const fetchMessages = async () => {
    if (!activeChannelData) return;
    try {
      setLoading(true);
      setMessages([]);

      let roomType = "job-announcements";
      if (activeChannelData.type === "assessment") {
        roomType = "assessment-updates";
      } else if (activeChannelData.type === "job") {
        // For company job channels, use assessment-updates
        roomType = "assessment-updates";
      }

      const roomId = getRoomId();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/chat/${roomType}/${roomId}`
      );
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;
    try {
      let roomType = "job-announcements";
      if (activeChannelData?.type === "assessment") {
        roomType = "assessment-updates";
      } else if (activeChannelData?.type === "job") {
        // For company job channels, use assessment-updates
        roomType = "assessment-updates";
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/chat`,
        {
          content: messageInput,
          sender: userId,
          roomType: roomType,
          roomId: getRoomId(),
        }
      );
      setMessageInput("");
      await fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch unread counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/chat/unread-counts?userId=${userId}`
      );
      const data = await res.json();
      setUnreadCounts(data.unreadCounts);
    };

    fetchUnreadCounts();
    socket.on("chat_message", fetchUnreadCounts);

    return () => {
      socket.off("chat_message", fetchUnreadCounts);
    };
  }, [userId]);

  // Initial data fetch based on user role
  useEffect(() => {
    if (userRole === "company") {
      fetchCompanyJobs();
    } else {
      fetchAssessments();
    }
  }, [userRole]);

  const filteredMessages = messages.filter(
    (msg) =>
      searchQuery === "" ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "administrator":
      case "admin":
        return "bg-red-500";
      case "moderator":
        return "bg-blue-500";
      case "teacher":
      case "instructor":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Group channels by type
  const jobChannels = channels.filter((c) => c.type === "job");
  const assessmentChannels = channels.filter((c) => c.type === "assessment");
  const generalChannels = channels.filter((c) => c.type === "general");

  useEffect(() => {
    if (!activeChannelData) return;

    const markAsRead = async () => {
      try {
        let roomType = "job-announcements";
        if (activeChannelData.type === "assessment") {
          roomType = "assessment-updates";
        } else if (activeChannelData.type === "job") {
          // For company job channels, use assessment-updates
          roomType = "assessment-updates";
        }

        const roomId = getRoomId();

        await axios.post(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/chat/mark-read`,
          {
            userId,
            roomType,
            roomId,
          }
        );

        setUnreadCounts((prev) => ({
          ...prev,
          [activeChannel]: 0,
        }));
      } catch (err) {
        console.error("Error marking as read:", err);
      }
    };

    fetchMessages();

    if (previousChannel.current !== activeChannel) {
      markAsRead();
      previousChannel.current = activeChannel;
    }
  }, [activeChannel]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Socket message handling
  useEffect(() => {
    socket.on(
      "chat_message",
      (msg: Message & { roomType: string; roomId: string }) => {
        let channelId = "job-announcements";

        if (msg.roomType === "assessment-updates") {
          // Check if this is a job channel or regular assessment channel
          const jobChannel = jobChannels.find(
            (ch) => ch.assessmentId === msg.roomId
          );
          if (jobChannel) {
            channelId = jobChannel.id; // job-{jobId}
          } else {
            channelId = `assessment-${msg.roomId}`;
          }
        } else if (
          msg.roomType === "job-announcements" &&
          msg.roomId !== "global"
        ) {
          channelId = `job-${msg.roomId}`;
        }

        if (channelId === activeChannel) {
          setMessages((prev) => [...prev, msg]);

          axios
            .post(
              `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/chat/mark-read`,
              {
                userId,
                roomType: msg.roomType,
                roomId: msg.roomId,
              }
            )
            .then(() => {
              setUnreadCounts((prev) => ({
                ...prev,
                [channelId]: 0,
              }));
            })
            .catch((err) =>
              console.error("Error marking message as read in real-time:", err)
            );
        } else {
          setUnreadCounts((prev) => ({
            ...prev,
            [channelId]: (prev[channelId] || 0) + 1,
          }));
        }
      }
    );

    return () => {
      socket.off("chat_message");
    };
  }, [activeChannel, userId, jobChannels]);

  return (
    <div className="flex h-[87vh] bg-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Server Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h1 className="font-bold text-lg text-gray-900">Campus Broadcast</h1>
          <p className="text-sm text-gray-600">Job & Assessment Hub</p>
        </div>

        {/* Channels */}
        <ScrollArea className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {/* General Job Announcements */}
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              General Channels
            </div>
            {generalChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-blue-50 transition-colors ${
                  activeChannel === channel.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span className="flex-1 text-left truncate">
                  {channel.name}
                </span>
              </button>
            ))}

            {/* Company Job Channels (Only for company users) */}
            {userRole === "company" && jobChannels.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">
                  Assessment Channels ({jobChannels.length})
                </div>
                {jobChannels.map((channel) => {
                  const unread = unreadCounts[channel.id] || 0;

                  return (
                    <button
                      key={channel.id}
                      onClick={() => setActiveChannel(channel.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-blue-50 transition-colors ${
                        activeChannel === channel.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="truncate" title={channel.name}>
                          {channel.name}
                        </span>
                      </div>
                      {unread > 0 && (
                        <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {unread}
                        </div>
                      )}
                    </button>
                  );
                })}
              </>
            )}

            {/* Assessment Channels (For non-company users) */}
            {userRole !== "company" && assessmentChannels.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">
                  Assessment Channels ({assessmentChannels.length})
                </div>
                {assessmentChannels.map((channel) => {
                  const unread = unreadCounts[channel.id] || 0;

                  return (
                    <button
                      key={channel.id}
                      onClick={() => setActiveChannel(channel.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-blue-50 transition-colors ${
                        activeChannel === channel.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="truncate" title={channel.displayName}>
                          {channel.name}
                        </span>
                      </div>
                      {userRole === "student" && unread > 0 && (
                        <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {unread}
                        </div>
                      )}
                    </button>
                  );
                })}
              </>
            )}

            {/* Loading state */}
            {((userRole === "company" && jobChannels.length === 0) ||
              (userRole !== "company" && assessmentChannels.length === 0)) && (
              <div className="px-2 py-2 text-xs text-gray-500">
                {userRole === "company"
                  ? "Loading company jobs..."
                  : "Loading assessments..."}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {activeChannelData?.type === "job" ||
            activeChannelData?.type === "assessment" ? (
              <FileText className="w-5 h-5 text-gray-600" />
            ) : (
              <Hash className="w-5 h-5 text-gray-600" />
            )}
            <h2 className="font-semibold text-gray-900">
              {activeChannelData?.displayName}
            </h2>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <p className="text-sm text-gray-600">
              {activeChannelData?.type === "job"
                ? "Job assessment updates and announcements"
                : activeChannelData?.type === "assessment"
                ? "Assessment updates and notifications"
                : "General job announcements"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-60 pl-10 bg-blue-50 border-blue-100 text-gray-700 placeholder-gray-500 focus:bg-white focus:border-blue-300"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea
          className="flex-1 overflow-y-auto p-4 bg-gray-50"
          ref={scrollRef}
        >
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                <div className="text-gray-600">Loading messages...</div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600 mb-2">
                  {searchQuery ? "No messages found" : "No announcements yet"}
                </div>
                <p className="text-sm text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Check back later for updates"}
                </p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message._id}
                  className="flex gap-3 hover:bg-white p-3 rounded-lg transition-colors"
                >
                  <Avatar className="w-10 h-10 mt-1">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback className="bg-gray-200 text-gray-700">
                      {typeof message.sender?.name === "string"
                        ? message.sender.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize text-gray-900">
                        {message.sender.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs px-2 py-0.5 ${getRoleColor(
                          message.sender.role
                        )} text-white`}
                      >
                        {message.sender.role}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0.5 border-blue-400 text-blue-600 bg-blue-50"
                      >
                        ASSESSMENT
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    <div className="text-gray-800 leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          {userRole === "student" ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Hash className="w-4 h-4" />
              <span>
                Only administrators can post announcements in this channel
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Write your assessment announcement..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
              />
              <Button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

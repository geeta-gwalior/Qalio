"use client";

import { useState, useEffect } from "react";
import { Search, Smile, Plus, Send, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Contact, Message } from "@/types/chats";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

// Add the import for emoji-picker-react at the top of the file, after the other imports
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";

// Sample data for contacts
const contacts = [
  {
    id: 1,
    name: "Darrell Steward",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    active: true,
  },
  {
    id: 2,
    name: "Cody Fisher",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 3,
    name: "Courtney Henry",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "https://randomuser.me/api/portraits/women/45.jpg",
  },
  {
    id: 4,
    name: "Ralph Edwards",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "https://randomuser.me/api/portraits/men/35.jpg",
  },
  {
    id: 5,
    name: "Floyd Miles",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "https://randomuser.me/api/portraits/men/37.jpg",
  },
  {
    id: 6,
    name: "Ronald Richards",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "https://randomuser.me/api/portraits/men/24.jpg",
  },
  {
    id: 7,
    name: "Robert Fox",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 8,
    name: "Eleanor Pena",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "https://randomuser.me/api/portraits/women/41.jpg",
  },
  {
    id: 9,
    name: "Kathryn Murphy",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "https://randomuser.me/api/portraits/women/29.jpg",
  },
  {
    id: 10,
    name: "Kristin Watson",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "https://randomuser.me/api/portraits/women/47.jpg",
  },
  {
    id: 11,
    name: "James Smith",
    message: "Hey, just wanted to check in about the project deadline...",
    date: "7 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 12,
    name: "Amelia Brown",
    message: "Can you send me the report when you get a chance?",
    date: "7 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 13,
    name: "Liam Johnson",
    message: "The designs look great! Did you make them in Figma?",
    date: "8 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 14,
    name: "Olivia Wilson",
    message: "Do you remember the name of the plugin we used...",
    date: "8 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 15,
    name: "Benjamin Lee",
    message: "Are you attending the meeting later today?",
    date: "9 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 16,
    name: "Sophia Davis",
    message: "Could you please review my code when you get time?",
    date: "10 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 17,
    name: "Noah Miller",
    message: "We should update the landing page images...",
    date: "10 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 18,
    name: "Emma Taylor",
    message: "Thanks for the help yesterday, I really appreciate it!",
    date: "11 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 19,
    name: "Lucas Martinez",
    message: "Did you get a chance to test the new feature?",
    date: "11 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 20,
    name: "Mia Thompson",
    message: "Let's schedule a quick call tomorrow morning?",
    date: "12 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
];

// Messages organized by contact ID
const messagesByContact: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      sender: "Darrell Steward",
      content:
        "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.",
      timestamp: "Saturday 12:35PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content:
        "If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
      timestamp: "Saturday 12:40PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 3,
      sender: "Darrell Steward",
      content:
        "All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet.",
      timestamp: "Saturday 12:45PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  2: [
    {
      id: 1,
      sender: "Cody Fisher",
      content:
        "It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable.",
      timestamp: "Saturday 11:20AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content:
        "The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.",
      timestamp: "Saturday 11:25AM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  3: [
    {
      id: 1,
      sender: "You",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      timestamp: "Friday 3:15PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "Courtney Henry",
      content:
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      timestamp: "Friday 3:20PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 3,
      sender: "You",
      content:
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      timestamp: "Friday 3:25PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 4,
      sender: "Courtney Henry",
      content:
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      timestamp: "Friday 3:30PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  4: [
    {
      id: 1,
      sender: "Ralph Edwards",
      content:
        "The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.",
      timestamp: "Thursday 9:10AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content:
        "Sections 1.10.32 and 1.10.33 from 'de Finibus Bonorum et Malorum' by Cicero are also reproduced in their exact original form.",
      timestamp: "Thursday 9:15AM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  5: [
    {
      id: 1,
      sender: "You",
      content:
        "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC.",
      timestamp: "Wednesday 2:30PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "Floyd Miles",
      content:
        "Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur.",
      timestamp: "Wednesday 2:35PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  6: [
    {
      id: 1,
      sender: "Ronald Richards",
      content:
        "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.",
      timestamp: "Tuesday 10:05AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content:
        "If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
      timestamp: "Tuesday 10:10AM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 3,
      sender: "Ronald Richards",
      content:
        "All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary.",
      timestamp: "Tuesday 10:15AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  7: [
    {
      id: 1,
      sender: "You",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      timestamp: "Monday 4:45PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "Robert Fox",
      content:
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      timestamp: "Monday 4:50PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  8: [
    {
      id: 1,
      sender: "Eleanor Pena",
      content:
        "The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.",
      timestamp: "Sunday 1:15PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content:
        "Sections 1.10.32 and 1.10.33 from 'de Finibus Bonorum et Malorum' by Cicero are also reproduced in their exact original form.",
      timestamp: "Sunday 1:20PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 3,
      sender: "Eleanor Pena",
      content:
        "It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures.",
      timestamp: "Sunday 1:25PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  9: [
    {
      id: 1,
      sender: "You",
      content:
        "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC.",
      timestamp: "Saturday 11:00AM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "Kathryn Murphy",
      content:
        "Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur.",
      timestamp: "Saturday 11:05AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  10: [
    {
      id: 1,
      sender: "Kristin Watson",
      content:
        "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.",
      timestamp: "Friday 9:30AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content:
        "If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
      timestamp: "Friday 9:35AM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
  11: [
    {
      id: 1,
      sender: "James Smith",
      content:
        "Hey, just wanted to check in about the project deadline. Is it still the same?",
      timestamp: "Monday 10:15AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content:
        "Yes, the deadline is still Friday. Let me know if you need any help before then.",
      timestamp: "Monday 10:20AM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],

  12: [
    {
      id: 1,
      sender: "Amelia Brown",
      content: "Can you send me the report when you get a chance?",
      timestamp: "Tuesday 2:00PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content: "I'll email it to you in a few minutes.",
      timestamp: "Tuesday 2:05PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],

  13: [
    {
      id: 1,
      sender: "Liam Johnson",
      content: "The designs look great! Did you make them in Figma?",
      timestamp: "Wednesday 4:45PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content: "Thanks! Yes, I used Figma and added a few custom elements too.",
      timestamp: "Wednesday 4:50PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],

  14: [
    {
      id: 1,
      sender: "Olivia Wilson",
      content: "Do you remember the name of the plugin we used last time?",
      timestamp: "Thursday 11:10AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content:
        "Yep, it was 'Tailwind Typography'. Want me to send you the link?",
      timestamp: "Thursday 11:12AM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],

  15: [
    {
      id: 1,
      sender: "Benjamin Lee",
      content: "Are you attending the meeting later today?",
      timestamp: "Friday 1:30PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content: "Yes, I'll be there. I've prepared the slides too.",
      timestamp: "Friday 1:35PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],

  16: [
    {
      id: 1,
      sender: "Sophia Davis",
      content: "Could you please review my code when you get time?",
      timestamp: "Saturday 3:00PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content: "Sure, I'll check it out after my break.",
      timestamp: "Saturday 3:10PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],

  17: [
    {
      id: 1,
      sender: "Noah Miller",
      content: "We should update the landing page images, they look outdated.",
      timestamp: "Sunday 9:45AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content:
        "Good point. I'll replace them with fresh ones from the asset library.",
      timestamp: "Sunday 9:50AM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],

  18: [
    {
      id: 1,
      sender: "Emma Taylor",
      content: "Thanks for the help yesterday, I really appreciate it!",
      timestamp: "Monday 8:00AM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content: "Of course! Let me know if you need anything else.",
      timestamp: "Monday 8:05AM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],

  19: [
    {
      id: 1,
      sender: "Lucas Martinez",
      content: "Did you get a chance to test the new feature?",
      timestamp: "Tuesday 5:30PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content: "Yep, tested and pushed to staging. All good!",
      timestamp: "Tuesday 5:35PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],

  20: [
    {
      id: 1,
      sender: "Mia Thompson",
      content: "Let's schedule a quick call tomorrow morning?",
      timestamp: "Wednesday 6:15PM",
      isCurrentUser: false,
      avatar: "/placeholder.svg?height=24&width=24",
    },
    {
      id: 2,
      sender: "You",
      content: "Sounds good! How about 9:30AM?",
      timestamp: "Wednesday 6:18PM",
      isCurrentUser: true,
      avatar: "/placeholder.svg?height=24&width=24",
    },
  ],
};

// Default messages for new contacts or if no messages exist
const defaultMessages: Message[] = [
  {
    id: 1,
    sender: "System",
    content: "No messages yet. Start a conversation!",
    timestamp: "Just now",
    isCurrentUser: false,
    avatar: "/placeholder.svg?height=24&width=24",
  },
];

export default function MessagingApp() {
  const [activeContact, setActiveContact] = useState<Contact>(contacts[0]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>(
    messagesByContact[1] || defaultMessages
  );
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const isMobile = useIsMobile();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Update messages when active contact changes
  useEffect(() => {
    if (activeContact) {
      setCurrentMessages(
        messagesByContact[activeContact.id] || defaultMessages
      );

      // On mobile, show the chat when a contact is selected
    }
  }, [activeContact, isMobile]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sending a message
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: currentMessages.length + 1,
        sender: "You",
        content: messageInput,
        timestamp: new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        isCurrentUser: true,
        avatar: "/placeholder.svg?height=24&width=24",
      };

      const updatedMessages = [...currentMessages, newMessage];
      setCurrentMessages(updatedMessages);

      // Update the messages for this contact in our data structure
      messagesByContact[activeContact.id] = updatedMessages;

      setMessageInput("");

      // Auto-scroll to the bottom of the messages
      setTimeout(() => {
        const messagesContainer = document.getElementById("messages-container");
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    }
  };

  // Handle back button click on mobile
  const handleBackClick = () => {
    setShowChat(false);
  };

  // Replace the handleEmojiSelect function with this updated version:
  const handleEmojiSelect = (emojiData: any) => {
    setMessageInput(messageInput + emojiData.emoji);

    // Add to recent emojis
    setRecentEmojis((prev) => {
      const newRecent = [
        emojiData.emoji,
        ...prev.filter((e) => e !== emojiData.emoji),
      ];
      return newRecent.slice(0, 20); // Keep only the 20 most recent
    });

    setShowEmojiPicker(false);
  };

  return (
    <div className="flex h-[87vh] bg-white rounded-lg shadow-xl">
      <div className="flex flex-1 overflow-hidden">
        {/* Contacts sidebar - hidden on mobile when chat is shown */}
        <div
          className={cn(
            "border-r border-dashed border-[#219CAE] h-full flex flex-col",
            isMobile
              ? showChat
                ? "hidden"
                : "border-none w-full"
              : "w-[260px]"
          )}
        >
          <div className="p-4">
            <h1 className="text-xl font-semibold text-[#242424]">Messages</h1>
          </div>

          {/* Search box */}
          <div className="px-4 pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[#219CAE]" />
              </div>
              <Input
                className="pl-10 bg-[#E4EEFF] placeholder:text-[#219CAE] text-[#219CAE] border-none rounded-md h-10"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Contacts list */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "flex items-start p-3 cursor-pointer hover:bg-gray-50",
                    activeContact.id === contact.id && "bg-gray-50"
                  )}
                  onClick={() => {
                    setActiveContact(contact);
                    if (isMobile) setShowChat(true);
                  }}
                >
                  <Avatar className="h-10 w-10 border border-[#F68622]">
                    <AvatarImage
                      src={contact.avatar || "/placeholder.svg"}
                      alt={contact.name}
                    />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-[#4C4C4C]">
                        {contact.name}
                      </p>
                      <span className="text-xs font-medium text-[#F68622]">
                        {contact.date}
                      </span>
                    </div>
                    <p className="text-sm text-[#4C4C4C] truncate">
                      {contact.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-[#8E8E8E]">
                No contacts found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>

        {/* Chat area - full width on mobile when chat is shown */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            isMobile && !showChat && "hidden"
          )}
        >
          {/* Chat header */}
          <div className="h-[70px] border-b shadow-sm flex items-center px-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={handleBackClick}
              >
                <ArrowLeft className="h-5 w-5 text-[#219CAE]" />
                <span className="sr-only">Back to messages</span>
              </Button>
            )}
            <Avatar className="h-[50px] w-[50px] border border-[#F68622]">
              <AvatarImage
                src={activeContact.avatar || "/placeholder.svg"}
                alt={activeContact.name}
              />
              <AvatarFallback>{activeContact.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h2 className="text-lg font-medium text-[#4C4C4C]">
                {activeContact.name}
              </h2>
              <p className="text-sm text-[#02C661]">Online Now</p>
            </div>
            <div className="ml-auto h-full">
              <Button variant="ghost" className="p-4 h-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#8E8E8E]"
                  style={{ width: "28px", height: "28px" }}
                  fill="currentColor"
                  viewBox="0 0 26 26"
                >
                  <circle cx="13" cy="3" r="3" />
                  <circle cx="13" cy="12" r="3" />
                  <circle cx="13" cy="21" r="3" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div
            id="messages-container"
            className="flex-1 overflow-y-auto p-4 space-y-6"
          >
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={
                      index % 2 === 0
                        ? "flex justify-start"
                        : "flex justify-end"
                    }
                  >
                    <div className="flex items-start space-x-2 max-w-[600px]">
                      {/* Avatar Skeleton (left for receiver, right for sender) */}
                      {index % 2 === 0 && (
                        <Skeleton className="h-8 w-8 rounded-full" />
                      )}

                      {/* Message Skeleton Content */}
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-12 w-64 rounded-lg" />
                      </div>

                      {index % 2 !== 0 && (
                        <Skeleton className="h-8 w-8 rounded-full" />
                      )}
                    </div>
                  </div>
                ))
              : currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className="flex items-start space-x-2 max-w-[600px]">
                      {/* Avatar for Receiver (left) */}
                      {!message.isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={activeContact.avatar || "/placeholder.svg"}
                            alt={message.sender}
                          />
                          <AvatarFallback>
                            {message.sender?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {/* Message Content */}
                      <div className="flex flex-col space-y-1">
                        {/* Name and Timestamp */}
                        <div
                          className={cn(
                            "text-[#4C4C4C] flex items-center space-x-2",
                            message.isCurrentUser
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          <span className="font-semibold text-sm">
                            {message.isCurrentUser ? "You" : message.sender}
                          </span>
                          <span className="text-xs">{message.timestamp}</span>
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={cn(
                            "p-3 rounded-lg border border-[#219CAE] text-sm text-[#4C4C4C]",
                            message.isCurrentUser
                              ? "bg-[#EFFCEF] rounded-tr-none"
                              : "bg-[#E6F5F9] rounded-tl-none"
                          )}
                        >
                          {message.content}
                        </div>
                      </div>

                      {/* Avatar for Sender (right) */}
                      {message.isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={message.avatar || "/placeholder.svg"}
                            alt="You"
                          />
                          <AvatarFallback>Y</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
          </div>

          {/* Message input */}
          <div className="p-4">
            <div className="relative">
              <Input
                className="w-full border-[#219CAE] rounded-lg pl-4 pr-32 py-6"
                placeholder="Text here..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />
              {showEmojiPicker && (
                <div className="absolute bottom-16 right-0 z-10">
                  <div className="relative">
                    <div className="absolute bottom-2 right-8 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200"></div>
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      searchPlaceHolder="Search emoji..."
                      width={320}
                      height={400}
                      emojiStyle={EmojiStyle.NATIVE}
                      theme={Theme.LIGHT}
                      lazyLoadEmojis={true}
                      previewConfig={{
                        showPreview: true,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#8E8E8E]"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile
                    style={{ width: "22px", height: "22px" }}
                    className="h-9 w-7"
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="iconplus"
                  className="h-5 w-5 text-[#8E8E8E]"
                >
                  <Plus
                    style={{ width: "22px", height: "22px" }}
                    className="h-5 w-5"
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#8E8E8E]"
                  onClick={handleSendMessage}
                >
                  <Send
                    style={{ width: "22px", height: "22px" }}
                    className="h-5 w-5"
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

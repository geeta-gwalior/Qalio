import type { Contact, Message } from "@/types/chats"

export const contacts: Contact[] = [
  {
    id: 1,
    name: "Darrell Steward",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
    active: true,
  },
  {
    id: 2,
    name: "Cody Fisher",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    name: "Courtney Henry",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    name: "Ralph Edwards",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 5,
    name: "Floyd Miles",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 6,
    name: "Ronald Richards",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
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
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 9,
    name: "Kathryn Murphy",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 10,
    name: "Kristin Watson",
    message: "There are many variations of",
    date: "6 Feb",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

// Messages organized by contact ID
export const messagesByContact: Record<number, Message[]> = {
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
      content: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
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
      content: "The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.",
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
      content: "All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary.",
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
      content: "The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.",
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
      content: "It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures.",
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
}

// Default messages for new contacts
export const defaultMessages: Message[] = [
  {
    id: 1,
    sender: "Devon Lane",
    content:
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum.",
    timestamp: "Saturday 12:35PM",
    isCurrentUser: true,
    avatar: "/placeholder.svg?height=24&width=24",
  },
  {
    id: 2,
    sender: "Jenny Wilson",
    content:
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum.",
    timestamp: "Saturday 12:35PM",
    isCurrentUser: false,
    avatar: "/placeholder.svg?height=24&width=24",
  },
]

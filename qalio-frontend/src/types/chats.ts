export interface Contact {
    id: number
    name: string
    message: string
    date: string
    avatar: string
    active?: boolean
  }
  
  export interface Message {
    id: number
    sender: string
    content: string
    timestamp: string
    isCurrentUser: boolean
    avatar: string
  }
  
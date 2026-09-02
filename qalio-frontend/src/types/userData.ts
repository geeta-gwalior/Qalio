export interface UserData {
    name: string
    title: string
    email: string
    phone: string
    location: string
    website: string
    education: Education
    skills: Skills
    portfolio: Portfolio
  }
  
  export interface Education {
    collegeName: string
    degree: string
    startDate: string
    endDate: string
    description: string
  }
  
  export interface Skills {
    softwareKnowledge: string[]
    achievements: string[]
    codingLanguages: string[]
    languages: string[]
  }
  
  export interface Portfolio {
    url: string
  }
  
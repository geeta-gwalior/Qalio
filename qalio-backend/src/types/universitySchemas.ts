import mongoose,{Document} from 'mongoose';

export interface IComment{
    comment: string;
    commentedBy: mongoose.Types.ObjectId;
    commentedAt: Date;
}

export interface IUniversity extends Document {
    userId: mongoose.Types.ObjectId;
    logo?: string;
    description?: string;
    website?: string;
    tests?: mongoose.Types.ObjectId[];
    colleges?: mongoose.Types.ObjectId[];
    commentsByAdmin?: IComment[];
    adminNotes?: string;
  }
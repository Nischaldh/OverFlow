import { Schema, models, model, Types, Document } from "mongoose";

export interface IAccount{
    userID:Types.ObjectId,
    name:string
    password?:string;
    image?:string;
    provider:string;
    providerAccountId: string;
}

export interface IAccountDoc extends IAccount, Document{}

const AccountSchema = new Schema<IAccount>({
    userID:{type:Schema.Types.ObjectId, ref:"User", required: true},
    name:{type:String, required:true},
    password:{type:String},
    image:{type:String},
    provider:{type:String, required:true},
    providerAccountId: {type:String, required:true}
}, {timestamps:true});

const Account = models?.Account||model<IAccount>("Account",AccountSchema)

export default Account;
import mongoose, {Schema, Model} from 'mongoose';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String, 
            required: true,
            trime: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },
        coverImage: {
            type: String,
        },
        watchHistory: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        }, 
        refreshToken: {
            type: String,
        }

    }, {timestamps: true},
);

//do something before(pre) saving(save) the data
userSchema.pre('save', async function (next){
    if(!this.isModified('password'))
        return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//inject a method to check if password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

//inject a method to generate accessToken;
userSchema.methods.generateAccessToken = function(){
    
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id: this._id,
        }, 
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    ) 
}

export const User = mongoose.model('User', userSchema);
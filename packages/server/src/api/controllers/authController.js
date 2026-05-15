import { supabase } from "../../config/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "pathwise-secret-key-2026";

export const register = async (req, res) => {
    const { nim_nip, password, full_name, role } = req.body;

    if (!nim_nip || !password) {
        return res.status(400).json({
            success: false,
            message: "NIM and Password are required"
        });
    }

    try {
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('nim_nip')
            .eq('nim_nip', nim_nip)
            .single();

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this NIM already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('profiles')
            .insert([
                {
                    nim_nip,
                    password: hashedPassword,
                    full_name: full_name || nim_nip,
                    role: role || 'student'
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: { nim_nip: data[0].nim_nip, role: data[0].role }
        });
    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to register user: " + err.message
        });
    }
};

export const login = async (req, res) => {
    const { nim_nip, password } = req.body;

    if (!nim_nip || !password) {
        return res.status(400).json({
            success: false,
            message: "NIM and Password are required"
        });
    }

    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('nim_nip', nim_nip)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid NIM or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid NIM or password"
            });
        }

        const token = jwt.sign(
            { id: user.id, nim_nip: user.nim_nip, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                nim_nip: user.nim_nip,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};

export const simpleLogin = async (req, res) => {
    const { nim_nip } = req.body;

    if (!nim_nip) {
        return res.status(400).json({
            success: false,
            message: "NIM is required"
        });
    }

    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('nim_nip', nim_nip)
            .single();

        if (error || !user) {
            // Auto-register if user doesn't exist? Or just return error?
            // Let's just return error for now to be safe, but we can make it auto-register.
            return res.status(401).json({
                success: false,
                message: "User with this NIM not found. Please register first."
            });
        }

        const token = jwt.sign(
            { id: user.id, nim_nip: user.nim_nip, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: "Login successful via NIM",
            token,
            user: {
                id: user.id,
                nim_nip: user.nim_nip,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Simple Login Error:", err.message);
        res.status(500).json({
            success: false,
            message: "Server error during simple login"
        });
    }
};

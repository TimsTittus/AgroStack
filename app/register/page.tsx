"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

function Register() {
	const [email, setEmail] = useState("")
	const [name, setName] = useState("") 
	const [phone, setPhone] = useState("")
	const [role, setRole] = useState<"farmer" | "buyer">("farmer")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()

	const validate = () => {
		if (!name) {
			setError("Name is required")
			return false
		}
		if (!email || !phone || !password || !confirmPassword) {
			setError("All fields are required")
			return false
		}
		if (!/^\+?\d{7,15}$/.test(phone)) {
			setError("Enter a valid phone number (digits, may start with +)")
			return false
		}
		if (password.length < 6) {
			setError("Password must be at least 6 characters")
			return false
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match")
			return false
		}
		return true
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		if (!validate()) return
		setLoading(true)
		try {
			const { data, error } = await authClient.signUp.email({ email, name, phone, password, role })
			if (error) {
				setError(error.message || "Registration failed")
				return
			}
			router.push("/login")
		} catch (err) {
			setError("Network error")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ maxWidth: 520, margin: "3rem auto", padding: 20, border: "1px solid #eee", borderRadius: 8 }}>
			<h2 style={{ marginBottom: 12 }}>Create an account</h2>
			<form onSubmit={handleSubmit}>
				<label style={{ display: "block", marginBottom: 10 }}>
					<span>Name</span>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						style={{ width: "100%", padding: 8, marginTop: 6 }}
					/>
				</label>
				<label style={{ display: "block", marginBottom: 10 }}>
					<span>Email</span>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						style={{ width: "100%", padding: 8, marginTop: 6 }}
					/>
				</label>

				<label style={{ display: "block", marginBottom: 10 }}>
					<span>Phone</span>
					<input
						type="tel"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						required
						placeholder="+1234567890"
						style={{ width: "100%", padding: 8, marginTop: 6 }}
					/>
				</label>

				<label style={{ display: "block", marginBottom: 10 }}>
					<span>Role</span>
					<select value={role} onChange={(e) => setRole(e.target.value as any)} style={{ width: "100%", padding: 8, marginTop: 6 }}>
						<option value="farmer">Farmer</option>
						<option value="buyer">Buyer</option>
					</select>
				</label>

				<label style={{ display: "block", marginBottom: 10 }}>
					<span>Password</span>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						style={{ width: "100%", padding: 8, marginTop: 6 }}
					/>
				</label>

				<label style={{ display: "block", marginBottom: 10 }}>
					<span>Confirm Password</span>
					<input
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
						style={{ width: "100%", padding: 8, marginTop: 6 }}
					/>
				</label>

				{error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}

				<button type="submit" disabled={loading} style={{ padding: "8px 14px" }}>
					{loading ? "Creating..." : "Create account"}
				</button>
			</form>

			<p style={{ marginTop: 12, fontSize: 13, color: "#555" }}>
				Already have an account? <a href="/login">Sign in</a>
			</p>
		</div>
	)
}

export default Register
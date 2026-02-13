"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const {data,error} = await authClient.signIn.email({email,password});
			if(error){
                alert("Login fail");
            }
            if(data){
                alert("Login sucesssss");
            }
			router.push('/');
		} catch (err) {
			setError('Network error');
            alert("Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ maxWidth: 420, margin: '4rem auto', padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
			<h2 style={{ marginBottom: 12 }}>Sign in</h2>
			<form onSubmit={handleSubmit}>
				<label style={{ display: 'block', marginBottom: 8 }}>
					<span>Email</span>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						style={{ width: '100%', padding: 8, marginTop: 6 }}
					/>
				</label>
				<label style={{ display: 'block', margin: '12px 0' }}>
					<span>Password</span>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						style={{ width: '100%', padding: 8, marginTop: 6 }}
					/>
				</label>
				{error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
				<button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
					{loading ? 'Signing in...' : 'Sign in'}
				</button>
			</form>
			
		</div>
	)
}

export default Login
import { useState, useEffect } from 'react';
import apiClient from '../api/client';

function InvestorDashboard() {
    const [tokens, setTokens] = useState([]);
    const [selectedTokenId, setSelectedTokenId] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [amount, setAmount] = useState('');

    const fetchTokens = () => {
        apiClient.get('/investors/tokens')
            .then((response) => {
                setTokens(response.data);
            })
            .catch((error) => {
                console.error('Error fetching tokens:', error);
            });
    };

    useEffect(() => {
        fetchTokens();
    }, []);

    const handleInvest = (e) => {
        e.preventDefault();

        apiClient.post(`/investors/tokens/${selectedTokenId}/invest`, {
            name,
            email,
            amount: Number(amount),
        })
            .then(() => {
                setName('');
                setEmail('');
                setAmount('');
                setSelectedTokenId(null);
                fetchTokens();
            })
            .catch((error) => {
                alert(error.response?.data?.message || 'Investment failed');
            });
    };

    return (
        <div>
            <h1>Investor dashboard</h1>

            <ul>
                {tokens.map((token) => (
                    <li key={token._id}>
                        Token for {token.invoice?.businessName} — funded ₹{token.amountFunded} of ₹{token.totalValue} —{' '}
                        {token.isFullyFunded ? 'fully funded' : 'open for investment'}

                        {!token.isFullyFunded && (
                            <button onClick={() => setSelectedTokenId(token._id)}>
                                Invest in this token
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {selectedTokenId && (
                <form onSubmit={handleInvest}>
                    <h3>Invest in selected token</h3>
                    <div>
                        <label>Your name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label>Your email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label>Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit">Confirm investment</button>
                    <button type="button" onClick={() => setSelectedTokenId(null)}>Cancel</button>
                </form>
            )}
        </div>
    );
}

export default InvestorDashboard;
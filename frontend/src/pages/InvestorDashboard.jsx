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
            <h2>Investor dashboard</h2>

            {tokens.length === 0 && <p className="muted">No tokenized invoices yet.</p>}

            {tokens.map((token) => (
                <div className="card" key={token._id}>
                    <div className="row">
                        <strong>{token.invoice?.businessName}</strong>
                        <span className={token.isFullyFunded ? 'badge badge-funded' : 'badge badge-tokenized'}>
                            {token.isFullyFunded ? 'fully funded' : 'open'}
                        </span>
                    </div>

                    <div className="progress">
                        <div
                            className="progress-fill"
                            style={{ width: `${(token.amountFunded / token.totalValue) * 100}%` }}
                        ></div>
                    </div>

                    <p className="muted">
                        ₹{token.amountFunded.toLocaleString('en-IN')} of ₹{token.totalValue.toLocaleString('en-IN')} funded
                    </p>

                    {!token.isFullyFunded && (
                        <button onClick={() => setSelectedTokenId(token._id)}>
                            Invest in this token
                        </button>
                    )}
                </div>
            ))}

            {selectedTokenId && (
                <form className="card" onSubmit={handleInvest}>
                    <h3>Invest in selected token</h3>

                    <div className="field">
                        <label>Your name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field">
                        <label>Your email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field">
                        <label>Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="button-row">
                        <button type="submit" className="primary">Confirm investment</button>
                        <button type="button" onClick={() => setSelectedTokenId(null)}>Cancel</button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default InvestorDashboard;
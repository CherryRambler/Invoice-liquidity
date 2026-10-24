import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const formatINR = (value) => value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

function tokenBadge(token) {
    if (token.invoice?.status === 'repaid') return { className: 'badge badge-repaid', label: 'repaid' };
    if (token.isFullyFunded) return { className: 'badge badge-funded', label: 'fully funded' };
    return { className: 'badge badge-tokenized', label: 'open' };
}

function InvestorDashboard() {
    const [tokens, setTokens] = useState([]);
    const [selectedTokenId, setSelectedTokenId] = useState(null);
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchTokens = () => {
        apiClient.get('/investors/tokens')
            .then((response) => {
                setTokens(response.data);
            })
            .catch((error) => {
                setError(error.response?.data?.message || 'Could not load tokens');
            });
    };

    useEffect(() => {
        fetchTokens();
    }, []);

    const selectToken = (tokenId) => {
        setSelectedTokenId(tokenId);
        setAmount('');
        setError('');
    };

    const handleInvest = (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        apiClient.post(`/investors/tokens/${selectedTokenId}/invest`, {
            amount: Number(amount),
        })
            .then(() => {
                selectToken(null);
                fetchTokens();
            })
            .catch((error) => {
                setError(error.response?.data?.message || 'Investment failed');
                fetchTokens();
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <div>
            <h2>Investor dashboard</h2>

            {error && !selectedTokenId && <p className="error-text">{error}</p>}

            {tokens.length === 0 && <p className="muted">No tokenized invoices yet.</p>}

            {tokens.map((token) => {
                const face = token.faceValue ?? token.totalValue;
                const returnPct = ((face / token.totalValue - 1) * 100).toFixed(2);
                const remaining = token.totalValue - token.amountFunded;
                const myInvestment = token.investments.reduce((sum, investment) => sum + investment.amount, 0);
                const badge = tokenBadge(token);
                const isSelected = token._id === selectedTokenId;
                const expectedPayout = isSelected && Number(amount) > 0
                    ? (Number(amount) * face) / token.totalValue
                    : 0;

                return (
                    <div className="card" key={token._id}>
                        <div className="row">
                            <strong>{token.invoice?.businessName ?? 'Unknown business'}</strong>
                            <span className={badge.className}>{badge.label}</span>
                        </div>

                        <div className="progress">
                            <div
                                className="progress-fill"
                                style={{ width: `${Math.min(token.amountFunded / token.totalValue, 1) * 100}%` }}
                            ></div>
                        </div>

                        <p className="muted">
                            ₹{formatINR(token.amountFunded)} of ₹{formatINR(token.totalValue)} funded
                            {token.invoice?.dueDate && ` · matures ${token.invoice.dueDate.slice(0, 10)}`}
                        </p>

                        <p className="muted">
                            Pays back ₹{formatINR(face)} at maturity · return {returnPct}%
                        </p>

                        {myInvestment > 0 && (
                            <p className="muted">
                                Your investment: ₹{formatINR(myInvestment)} → ₹{formatINR((myInvestment * face) / token.totalValue)} at repayment
                            </p>
                        )}

                        {!token.isFullyFunded && !isSelected && (
                            <button onClick={() => selectToken(token._id)}>
                                Invest in this token
                            </button>
                        )}

                        {isSelected && error && <p className="error-text">{error}</p>}

                        {isSelected && !token.isFullyFunded && (
                            <form onSubmit={handleInvest}>
                                <div className="field">
                                    <label>Amount (₹, whole rupees, up to ₹{formatINR(remaining)})</label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max={remaining}
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>

                                {expectedPayout > 0 && (
                                    <p className="muted">
                                        You will receive ₹{formatINR(expectedPayout)} at repayment.
                                    </p>
                                )}

                                <div className="button-row">
                                    <button type="submit" className="primary" disabled={submitting}>
                                        {submitting ? 'Investing...' : 'Confirm investment'}
                                    </button>
                                    <button type="button" onClick={() => selectToken(null)}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default InvestorDashboard;

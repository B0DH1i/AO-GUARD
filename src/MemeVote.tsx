import React, { useEffect, useState } from 'react';
import { dryrun, message, createDataItemSigner, result } from '@permaweb/aoconnect/browser';
import { PermissionType } from 'arconnect';
import './MemeVote.css';

const GARD = "jpp5Yy2LVExtw8n8PvC7Sz2i5GQehVjfiQlWi0TYBqE";

const permissions: PermissionType[] = [
    'ACCESS_ADDRESS',
    'SIGNATURE',
    'SIGN_TRANSACTION',
    'DISPATCH'
];

interface VoteItem {
    tx: string;
    yay: number;
    nay: number;
    deadline: number;
}

const MemeVote: React.FC = () => {
    const [address, setAddress] = useState('');
    const [voteData, setVoteData] = useState<VoteItem[]>([]);

    const fetchAddress = async () => {
        await window.arweaveWallet.connect(
            permissions,
            {
                name: "GARD-DAO",
                logo: "r0THy0vN0VqEhdg8sZNBVPfu30wBwgUefdGOTsQ0SaY"
            }
        );
        try {
            const address = await window.arweaveWallet.getActiveAddress();
            setAddress(address);
        } catch (error) {
            console.error(error);
        }
    };

    const getVotes = async () => {
        try {
            const result = await dryrun({
                process: GARD,
                tags: [
                    { name: 'Action', value: "Get-Votes" }
                ]
            });
            if (result && result.Messages[0]) {
                return JSON.parse(result.Messages[0].Data);
            } else {
                console.log("No readable data from dryrun!");
                return "";
            }
        } catch (e) {
            console.log(e);
            return "";
        }
    };

    const vote = async (id: string, side: string) => {
        console.log(id, side);
        try {
            const getVoteMessage = await message({
                process: GARD,
                tags: [
                    { name: 'Action', value: 'Vote' },
                    { name: 'Side', value: side.toString() },
                    { name: 'TXID', value: id.toString() },
                ],
                signer: createDataItemSigner(window.arweaveWallet),
            });
            const { Messages, Error } = await result({
                message: getVoteMessage,
                process: GARD,
            });
            if (Error) {
                alert("Error handling vote: " + Error);
                return;
            }
            if (!Messages || Messages.length === 0) {
                alert("No messages were returned from ao. Please try later.");
                return;
            }
            alert("Vote cast successfully!");
        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        const fetchVotes = async () => {
            const votes = await getVotes();
            if (typeof votes !== 'string') {
                setVoteData(votes);
            }
        };

        fetchVotes();
    }, [address]);

    return (
        <div className="vote-container">
            <h1 className="vote-title">Vote on Proposals</h1>
            <p className="vote-description">
                Welcome to the GARD-DAO voting page. Here, you can vote on various proposals using your staked GARD tokens. Each proposal has a deadline and shows the current vote counts for "Yay" and "Nay".
            </p>
            <div className="vote-grid">
                {voteData.map((item, index) => (
                    <div key={index} className="vote-card">
                        <p className="vote-candidate-title">Proposal #{index + 1}</p>
                        <a className="vote-candidate-link" href={`https://arweave.net/${item.tx}`} target="_blank" rel="noopener noreferrer">View Proposal</a>
                        <p className="vote-stats">Yay: {item.yay / 1000}, Nay: {item.nay / 1000}</p>
                        <p className="vote-deadline">Deadline: Block {item.deadline}</p>
                        {address ? (
                            <div className="vote-actions">
                                <button onClick={() => vote(item.tx, "yay")} className="vote-button vote-yay-button">Yes</button>
                                <button onClick={() => vote(item.tx, "nay")} className="vote-button vote-nay-button">No</button>
                                <p className="vote-info">Your vote will be cast with all the GARD tokens you currently have staked.</p>
                            </div>
                        ) : (
                            <div className="vote-connect-button-container">
                                <button onClick={fetchAddress} className="vote-connect-button">Connect Wallet</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MemeVote;

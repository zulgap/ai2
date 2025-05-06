import React from 'react';

interface AgentCardProps {
    name: string;
    description: string;
    status: string;
}

const AgentCard: React.FC<AgentCardProps> = ({ name, description, status }) => {
    return (
        <div className="agent-card">
            <h2>{name}</h2>
            <p>{description}</p>
            <span className={`status ${status?.toLowerCase() || 'unknown'}`}>{status || 'Unknown'}</span>
        </div>
    );
};

export default AgentCard;
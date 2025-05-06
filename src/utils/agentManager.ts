import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAgent = async (data) => {
    const agent = await prisma.agent.create({
        data,
    });
    return agent;
};

export const getAgents = async () => {
    const agents = await prisma.agent.findMany();
    return agents;
};

export const updateAgent = async (id, data) => {
    const agent = await prisma.agent.update({
        where: { id },
        data,
    });
    return agent;
};

export const deleteAgent = async (id) => {
    const agent = await prisma.agent.delete({
        where: { id },
    });
    return agent;
};
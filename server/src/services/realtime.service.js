const clients = new Set();

export const realtimeService = {
    addClient(res, userId = null) {
        clients.add({ res, userId });
        res.on('close', () => {
            for (const client of clients) if (client.res === res) clients.delete(client);
        });
    },
    publish(event, data, targetUserId = null) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        clients.forEach(client => {
            if (targetUserId && client.userId !== targetUserId) return;
            try { client.res.write(payload); } catch (_) { clients.delete(client); }
        });
    },
    heartbeat() { clients.forEach(client => { try { client.res.write(': heartbeat\n\n'); } catch (_) { clients.delete(client); } }); }
};
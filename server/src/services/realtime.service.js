const clients = new Set();

export const realtimeService = {
    addClient(res) { clients.add(res); res.on('close', () => clients.delete(res)); },
    publish(event, data) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        clients.forEach(res => { try { res.write(payload); } catch (_) { clients.delete(res); } });
    },
    heartbeat() { clients.forEach(res => { try { res.write(': heartbeat\n\n'); } catch (_) { clients.delete(res); } }); }
};
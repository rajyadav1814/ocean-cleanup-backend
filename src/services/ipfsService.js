export class IpfsService {
  async upload(payload) {
    return { cid: 'mock-cid', payload };
  }
}

export default new IpfsService();

export class ContractService {
  async submitActivity(payload) {
    return { ok: true, payload };
  }

  async verifyActivity(id) {
    return { ok: true, id };
  }
}

export default new ContractService();

export class NotificationService {
  async send(activity) {
    return { sent: true, activityId: activity.id };
  }
}

export default new NotificationService();

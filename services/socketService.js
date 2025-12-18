class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(io) {
    this.io = io;
  }

  emitNewBid(saleId, bidData) {
    if (this.io) {
      this.io.to(`sale-${saleId}`).emit("new-bid", bidData);
    }
  }

  emitAuctionEnded(saleId, data) {
    if (this.io) {
      this.io.to(`sale-${saleId}`).emit("auction-ended", data);
    }
  }
}

module.exports = new SocketService();

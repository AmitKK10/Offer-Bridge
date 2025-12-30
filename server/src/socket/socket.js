import jwt from "jsonwebtoken";

export const initSocket = (io) => {
  // 🔐 SOCKET AUTH MIDDLEWARE
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 🔥 ATTACH USER TO SOCKET
      socket.user = {
        id: decoded.id,
        role: decoded.role
      };

      console.log(
        `🔐 Socket auth OK → ${decoded.role}:${decoded.id}`
      );

      next();
    } catch (err) {
      console.error("❌ Socket auth failed");
      next(new Error("Unauthorized"));
    }
  });

  // 🔌 CONNECTION HANDLER
  io.on("connection", (socket) => {
    const { role, id } = socket.user; // ✅ NOW SAFE

    // join role room
    socket.join(role);

    // join personal room
    socket.join(`USER_${id}`);

    console.log(`🔌 ${role} joined USER_${id}`);

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${id}`);
    });
  });
};

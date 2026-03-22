package backend.db;

import java.sql.Connection;
import io.github.cdimascio.dotenv.Dotenv;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ConnectionFactory {
    //Connectionを作成する
    public static Connection createConnection() {
        Dotenv dotenv = Dotenv.load();

        String url = dotenv.get("DB_URL");
        String user = dotenv.get("DB_USER");
        String password = dotenv.get("DB_PASSWORD");

        try {
            Connection connection = DriverManager.getConnection(url, user, password);
            System.out.println(connection != null);
            return connection;
        } catch (SQLException sqlException) {
            throw new RuntimeException(sqlException);

        }

    }
}

package backend.db;

import java.sql.Connection;
import io.github.cdimascio.dotenv.Dotenv;
import java.sql.DriverManager;
import java.sql.SQLException;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConnectionFactory {
    @Bean
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

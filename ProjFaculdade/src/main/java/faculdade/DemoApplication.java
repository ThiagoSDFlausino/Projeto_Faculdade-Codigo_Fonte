package Faculdade;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import lombok.extern.log4j.Log4j2;

@Log4j2
@SpringBootApplication
public class FaculdadeApplication {

	public static void main(String[] args) {
		log.debug("debug");
		log.error("error");
		log.info("info");
		log.fatal("fatal");
		SpringApplication.run(FaculdadeApplication.class, args);
	}

}

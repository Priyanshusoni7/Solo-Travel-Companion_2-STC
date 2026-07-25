package com.stc.stc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan("com.stc.stc.entity")
public class StcApplication {

	public static void main(String[] args) {
		SpringApplication.run(StcApplication.class, args);
	}

}

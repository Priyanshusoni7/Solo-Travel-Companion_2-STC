package com.stc.stc.config;

import java.time.Duration;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        /*
         * activateDefaultTyping(NON_FINAL) embeds a "@class" (or similar) type
         * property into every serialized value in Redis. This is required here for
         * two reasons:
         *
         * 1. GenericJackson2JsonRedisSerializer deserializes without a statically-
         *    known target type. Without type metadata in the JSON it falls back to
         *    LinkedHashMap, so date fields (java.sql.Date) come back as plain Strings
         *    and Thymeleaf's #dates.format() throws a type-conversion error.
         *
         * 2. With type metadata, Jackson correctly reconstructs TravelCacheDto /
         *    UserSummaryDto and all their fields (java.sql.Date, HashMap<Integer,String>)
         *    because every embedded type is a standard, non-proxy Java class.
         *
         * *** Why is this now safe when it was broken before? ***
         * Previously, Hibernate-managed entities (Travel, User) were cached directly.
         * Those entities contain Hibernate proxy types (PersistentMap, PersistentBag,
         * etc.) and User implements Spring Security's UserDetails. activateDefaultTyping
         * embedded those Hibernate/framework class names into Redis JSON. Outside an
         * active Hibernate session those types cannot be resolved → deserialization
         * crashed with InvalidTypeIdException / LazyInitializationException.
         *
         * Now only TravelCacheDto and UserSummaryDto are ever cached. Every type
         * reachable from those DTOs is a standard Java type (java.sql.Date,
         * java.util.HashMap, String, etc.) that Jackson can instantiate with no
         * Hibernate session. activateDefaultTyping is therefore fully safe here.
         */
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .disableCachingNullValues()
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }
}


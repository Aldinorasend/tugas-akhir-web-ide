package com.pathwise;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.serialization.JavaParserJsonSerializer;
import com.github.javaparser.ast.serialization.JavaParserJsonSerializer; // Wait, checking correct import

import javax.json.Json;
import javax.json.JsonObject;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class Parser {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: Parser <file_path>");
            System.exit(1);
        }

        String filePath = args[0];
        try {
            String source = Files.readString(Paths.get(filePath));
            JavaParser javaParser = new JavaParser();
            var result = javaParser.parse(source);

            if (result.isSuccessful() && result.getResult().isPresent()) {
                CompilationUnit cu = result.getResult().get();
                // For now, let's just output a simple message to verify bridge
                // Actual JSON serialization will be added in integration phase
                System.out.println("{\"status\": \"success\", \"message\": \"Parsed successfully\"}");
            } else {
                System.out.println("{\"status\": \"error\", \"message\": \"Parse failed\"}");
            }
        } catch (IOException e) {
            System.err.println("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}");
            System.exit(1);
        }
    }
}

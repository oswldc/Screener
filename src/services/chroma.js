import { ChromaClient } from 'chromadb';
import fs from 'fs';
import * as pdfUtil from '../utils/pdf.js';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const chroma = new ChromaClient({
  path: process.env.CHROMA_URL || 'http://localhost:8000',
});

const embedder = new GoogleGenerativeAIEmbeddings({
  model: 'text-embedding-004',
  apiKey: process.env.GEMINI_API_KEY,
});

export async function ingestDocument(filePath, collectionName) {
  const text = await pdfUtil.extractTextFromPdf(filePath);
  const chunks = text.match(/.{1,1000}/g);

  // Gunakan embedDocuments, bukan embedTexts
  const embeddings = await embedder.embedDocuments(chunks);

  const collection = await getCollection(collectionName);
  await collection.add({
    ids: chunks.map((_, i) => `${collectionName}_${i}`),
    embeddings,
    documents: chunks,
  });

  console.log(`✅ Ingested ${chunks.length} chunks into ${collectionName}`);
}

export async function getRelevantContext(query, collectionName) {
  const collection = await getCollection(collectionName);
  const embedding = await embedder.embedQuery(query); // untuk query tunggal
  const results = await collection.query({
    queryEmbeddings: [embedding],
    nResults: 3,
  });
  return results.documents.flat().join('\n');
}

export async function addToChroma(jobId, jobTitle, cvText, reportText) {
  const collection = await getCollection('evaluated_candidates');

  const combined = `
  Job Title: ${jobTitle}
  CV:
  ${cvText}

  Project Report:
  ${reportText}
  `;

  // Gunakan embedDocuments karena ini array
  const [embedding] = await embedder.embedDocuments([combined]);

  await collection.add({
    ids: [jobId.toString()],
    documents: [combined],
    embeddings: [embedding],
    metadatas: [{ job_title: jobTitle }],
  });

  console.log(`✅ Added embeddings for job ${jobId} to ChromaDB`);
}

async function getCollection(name) {
  try {
    return await chroma.getCollection({ name });
  } catch (err) {
    return await chroma.createCollection({
      name,
      embeddingFunction: embedder,
    });
  }
}

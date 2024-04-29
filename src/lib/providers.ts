import { ChatOpenAI, OpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import {
  getEmbeddingsModel,
  getEmbeddingsProvider,
  getGroqApiKey,
  getOllamaApiEndpoint,
  getOpenaiApiKey,
} from '../config';

export const getAvailableProviders = async () => {
  const openAIApiKey = getOpenaiApiKey();
  const ollamaEndpoint = getOllamaApiEndpoint();
  const groqApiKey = getGroqApiKey();

  const models = {};

  if (openAIApiKey) {
    try {
      models['openai'] = {
        'gpt-3.5-turbo': new ChatOpenAI({
          openAIApiKey,
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
        }),
        'gpt-4': new ChatOpenAI({
          openAIApiKey,
          modelName: 'gpt-4',
          temperature: 0.7,
        }),
        embeddings: new OpenAIEmbeddings({
          openAIApiKey,
          modelName: 'text-embedding-3-large',
        }),
      };
    } catch (err) {
      console.log(`Error loading OpenAI models: ${err}`);
    }
  }

  if (ollamaEndpoint) {
    try {
      const response = await fetch(`${ollamaEndpoint}/api/tags`);

      const { models: ollamaModels } = (await response.json()) as any;

      models['ollama'] = ollamaModels.reduce((acc, model) => {
        acc[model.model] = new ChatOllama({
          baseUrl: ollamaEndpoint,
          model: model.model,
          temperature: 0.7,
        });
        return acc;
      }, {});

      if (Object.keys(models['ollama']).length > 0) {
        models['ollama']['embeddings'] = getEmbeddings();
      }
    } catch (err) {
      console.log(`Error loading Ollama models: ${err}`);
    }
  }

  if (groqApiKey) {
    try {
      const groqModels = [
        'llama3-8b-8192',
        'llama3-70b-8192',
        'mixtral-8x7b-32768',
        'gemma-7b-it',
      ];
      models['groq'] = groqModels.reduce((acc, model) => {
        acc[model] = new ChatGroq({
          apiKey: groqApiKey,
          model: model,
          temperature: 0.7,
        });
        return acc;
      }, {});

      if (Object.keys(models['groq']).length > 0) {
        models['groq']['embeddings'] = getEmbeddings();
      }
    } catch (err) {
      console.log(`Error loading Groq models: ${err}`);
    }
  }

  return models;
};

const getEmbeddings = () => {
  const provider = getEmbeddingsProvider();
  const model = getEmbeddingsModel();
  switch (provider) {
    case 'ollama':
      return new OllamaEmbeddings({
        baseUrl: getOllamaApiEndpoint(),
        model,
      });
    case 'openai':
    default:
      return new OpenAIEmbeddings({
        openAIApiKey: getOpenaiApiKey(),
        model,
      });
  }
};

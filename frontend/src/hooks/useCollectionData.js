import { useState, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Custom hook for fetching and managing collection schemas and items
 * @param {string} agentId - The agent ID
 * @param {string} collectionName - The collection name
 * @returns {Object} - Schema, items, loading state, and refetch function
 */
export function useCollectionData(agentId, collectionName) {
  const [schema, setSchema] = useState(null);
  const [allSchemas, setAllSchemas] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Get agent's schemas
      const schemasRes = await axios.get(`${API}/api/agents/${agentId}/schemas`, {
        withCredentials: true,
      });

      setAllSchemas(schemasRes.data || []);

      if (schemasRes.data.length === 0) {
        setLoading(false);
        return;
      }

      // Find schema by collection name (if provided) or use first
      let targetSchema;
      if (collectionName) {
        targetSchema = schemasRes.data.find(s => s.collection_name === collectionName);
      }
      if (!targetSchema) {
        targetSchema = schemasRes.data[0];
      }
      
      setSchema(targetSchema);

      // Fetch items for this collection
      const itemsRes = await axios.get(
        `${API}/api/agents/${agentId}/collections/${targetSchema.collection_name}/items`,
        { withCredentials: true }
      );
      setItems(itemsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, [agentId, collectionName]);

  return {
    schema,
    allSchemas,
    items,
    loading,
    fetchData,
    setItems,
  };
}

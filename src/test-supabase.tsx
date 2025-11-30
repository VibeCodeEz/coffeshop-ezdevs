import React, { useEffect, useState } from 'react';

// Import the centralized client
import { supabase as testClient } from './lib/supabase';

const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState('Testing...');
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    runTests();
  }, []);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const runTests = async () => {
    try {
      addResult('🔍 Starting Supabase tests...');

      // Test 1: Basic connection
      addResult('Test 1: Testing basic connection...');
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        });
        addResult(`✅ Raw fetch status: ${response.status}`);
        const text = await response.text();
        addResult(`📄 Response: ${text.substring(0, 100)}...`);
      } catch (error: any) {
        addResult(`❌ Raw fetch failed: ${error.message}`);
      }

      // Test 2: Supabase client basic call
      addResult('Test 2: Testing Supabase client...');
      try {
        const { data, error } = await testClient
          .from('menu_items')
          .select('count', { count: 'exact', head: true });
        
        addResult(`✅ Client call completed`);
        addResult(`📊 Data: ${JSON.stringify(data)}`);
        addResult(`❌ Error: ${JSON.stringify(error)}`);
      } catch (error: any) {
        addResult(`❌ Client call failed: ${error.message}`);
      }

      // Test 3: Check auth status
      addResult('Test 3: Checking auth...');
      const { data: { session } } = await testClient.auth.getSession();
      addResult(`👤 Session: ${session ? 'Logged in' : 'Anonymous'}`);

      // Test 4: Simple select
      addResult('Test 4: Attempting simple select...');
      try {
        const { data, error } = await testClient
          .from('menu_items')
          .select('*')
          .limit(1);
        
        addResult(`✅ Select completed`);
        addResult(`📊 Data count: ${data?.length || 0}`);
        if (error) {
          addResult(`❌ Error: ${error.message} (Code: ${error.code})`);
          addResult(`🔧 Hint: ${error.hint || 'No hint'}`);
          addResult(`📝 Details: ${error.details || 'No details'}`);
        }
      } catch (error: any) {
        addResult(`❌ Select failed: ${error.message}`);
      }

      setStatus('Tests completed');
    } catch (error: any) {
      addResult(`💥 Test suite failed: ${error.message}`);
      setStatus('Tests failed');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Supabase Connection Test</h2>
      <p><strong>Status:</strong> {status}</p>
      
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {results.map((result, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {result}
          </div>
        ))}
      </div>
      
      <button 
        onClick={runTests} 
        style={{ 
          marginTop: '10px', 
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Run Tests Again
      </button>
    </div>
  );
};

export default SupabaseTest;